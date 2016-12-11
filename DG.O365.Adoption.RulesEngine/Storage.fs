namespace DG.O365.Adoption.RulesEngine

module Storage =
  open System
  open Microsoft.WindowsAzure.Storage
  open Microsoft.WindowsAzure.Storage.Queue
  open Microsoft.WindowsAzure.Storage.Table
  open Newtonsoft.Json
  open FSharp.Data
  open FSharp.Configuration
  open FSharp.Data.HttpRequestHeaders
  open FSharp.Azure.Storage.Table
  open FSharp.Data.Sql

  open Config
  open Model
  open Result

  let fetchAccount =
    let conn = Settings.AzureConnectionString
    CloudStorageAccount.Parse conn

  // ConnectionStringName is looked up in the app.config and must contain a
  // valid connection string to a reachable database, and that database must
  // have a schema that correlates the contract of the code within this
  // namespace, or it will result in a compilation error.
  type sql =
   SqlDataProvider<
     ConnectionStringName = "SqlConnectionString",
     DatabaseVendor = Common.DatabaseProviderTypes.MSSQLSERVER,
     CaseSensitivityChange = Common.CaseSensitivityChange.ORIGINAL>


  let addRule (rule :Rule) db =
    let io (ctx :sql.dataContext) =
      let row = ctx.Dbo.Rules.Create()
      row.Name <- rule.Name
      row.DocumentationLink <- rule.DocumentationLink
      row.Query <- rule.Query
      row.Reducer <- rule.Reducer
      row.Message <- rule.Message
      ctx.SubmitUpdates()
    db |> tryCatch io


  let getAllRules db =
    let io (ctx :sql.dataContext) =
      query { for row in ctx.Dbo.Rules do
              select row} |> Seq.map (fun x -> x.MapTo<Rule>())
    db |> tryCatch io


  let fetchNotificationQueue =
    let account = fetchAccount
    let queueClient = account.CreateCloudQueueClient()
    queueClient.GetQueueReference("notification-queue")


  let fetchNotificationTable =
    let account = fetchAccount
    let tableName = "NotificationHistory"
    let tableClient = account.CreateCloudTableClient()
    let table = tableClient.GetTableReference(tableName)
    table.CreateIfNotExists() |> ignore
    let inSentTable entry = inTable tableClient tableName entry
    let fromSentTable q = fromTable tableClient tableName q
    inSentTable, fromSentTable


  let listUserTables =
    let account = fetchAccount
    let tableClient = account.CreateCloudTableClient()
    tableClient.ListTables()
    |> Seq.filter (fun t -> t.Name.StartsWith("Audit")) 
    |> Seq.toList


  let listUsers =
    listUserTables
    |> Seq.map (fun t -> t.Name)
    |> Seq.map (fun s -> s.Replace("Audit", ""))
    |> Seq.toList


  let fromAuditTable user query =
    let io (user, query) =
      let account = fetchAccount
      let tableClient = account.CreateCloudTableClient()
      let tableName = "Audit" + user
      let table = tableClient.GetTableReference(tableName)
      table.ExecuteQuery(query)
      |> Seq.map (fun e ->
                   { Date = e.PartitionKey;
                     Id = e.RowKey;
                     ServiceType = e.Item("ServiceType").ToString();
                     Operation = e.Item("Operation").ToString();
                     Status = e.Item("Result").ToString();
                     Time = e.Item("Time").ToString();
                     ObjectId = e.Item("ObjectId").ToString();
                     Json = e.Item("Json").ToString() })
      |> Seq.toArray
    (user, query) |> tryCatch io


  let writeNotificationToAzure (notification :SentNotification) =
    let write (msg :SentNotification) = 
      let inSentTable, _ = fetchNotificationTable 
      msg |> Insert |> inSentTable
    notification |> tryCatch write


  let notificationExists (notification :SentNotification) =

    let fromSentNotifications (n :SentNotification) =
      let _, fromSentTable = fetchNotificationTable 
      Query.all<SentNotification>
      |> Query.where <@ fun g s -> s.PartitionKey = n.UserId && g.RuleName = n.RuleName @>
      |> fromSentTable

    match notification |> tryCatch fromSentNotifications with
      | Success s -> not (Seq.isEmpty s)
      | Failure f -> true // In case of communication failure, assume it is there


  let pushToAzureStorageQueue (msgs :Notification[]) =
    let io msg =
      let queue = fetchNotificationQueue
      let _ = queue.CreateIfNotExists()
      // Azure Cloud Queue TTL cannot exceed 7 days
      let max = new TimeSpan(7, 0, 0, 0)
      msgs
      |> Array.iter (fun u ->
                      let n = new Nullable<TimeSpan>(max)
                      let json = JsonConvert.SerializeObject(u)
                      let msg = new CloudQueueMessage(json)
                      queue.AddMessage(msg, n))
    msgs |> tryCatch io


  let postNotification (n :Notification) =
    let io n =
      let _ = Http.Request(Settings.NotificationUri.ToString(), 
                           httpMethod = "POST",
                           headers = [ ContentType "application/json" ],
                           body = TextRequest (JsonConvert.SerializeObject n))
      ()
    n |> tryCatch io