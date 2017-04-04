namespace DG.O365.Adoption.RulesEngine

module Storage =
  open System
  open Microsoft.WindowsAzure.Storage
  open Microsoft.WindowsAzure.Storage.Queue
  open Microsoft.WindowsAzure.Storage.Table
  open System.Linq
  open Microsoft.FSharp.Linq
  open Newtonsoft.Json
  open FSharp.Data
  open FSharp.Configuration
  open FSharp.Data.HttpRequestHeaders
  open FSharp.Azure.Storage.Table
  open FSharp.Data.Sql

  open Config
  open Result

  let fetchAccount =
    let conn = Conf.RuleEngineConnectionString
    CloudStorageAccount.Parse conn
  let fetchDaleAccount =
    let conn = Conf.DaleConnectionString
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


  let addRule (rule :Rule)=
    let io (ctx :sql.dataContext) =
      let row = ctx.Dbo.Rules.Create()
      row.Name <- rule.Name
      row.DocumentationLink <- rule.DocumentationLink
      row.Query <- rule.Query
      row.Reducer <- rule.Reducer
      row.Message <- rule.Message
      row.ReceiverObjectId <- rule.ReceiverObjectId
      row.ReceiverName <- rule.ReceiverName
      row.IsGroup <- rule.IsGroup
      row.Dialog <- rule.Dialog
      ctx.SubmitUpdates()
    sql.GetDataContext() |>tryCatch io


  let deleteRule (ruleName :string) =
    let io (ctx :sql.dataContext) =
     let deletingRule=ctx.Dbo.Rules |> Seq.find(fun x ->x.Name.Equals(ruleName))
     deletingRule.Delete()
     ctx.SubmitUpdates()
    sql.GetDataContext() |> tryCatch io


  let updateRule (rule :Rule) =
    let io (ctx :sql.dataContext) =
     let originalRule=ctx.Dbo.Rules |> Seq.find(fun x ->x.Name.Equals(rule.Name))
     originalRule.DocumentationLink <- rule.DocumentationLink
     originalRule.Query <- rule.Query
     originalRule.Reducer <- rule.Reducer
     originalRule.Message <- rule.Message
     originalRule.ReceiverObjectId <- rule.ReceiverObjectId
     originalRule.ReceiverName <- rule.ReceiverName
     originalRule.IsGroup <- rule.IsGroup
     originalRule.Dialog <- rule.Dialog
     ctx.SubmitUpdates()
    sql.GetDataContext() |> tryCatch io
        

  let getAllRules =
    let io (ctx :sql.dataContext) =
      query { for row in ctx.Dbo.Rules do
              select row }
        |> Seq.map (fun x -> x.MapTo<Rule>())
    sql.GetDataContext() |> tryCatch io


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
    let account = fetchDaleAccount
    let tableClient = account.CreateCloudTableClient()
    tableClient.ListTables()
    |> Seq.filter (fun t -> t.Name.StartsWith("Audit"))
    |> Seq.toList


  let listUsers =
    listUserTables
    |> Seq.map (fun t -> t.Name)
    |> Seq.map (fun s -> s.Replace("Audit", ""))
    |> Seq.toList

  let tryGetKey (col :DynamicTableEntity) key =
     try
      col.Item(key).ToString()
     with
      | _ -> null

  let fromAuditTable user query =
    let io (user, query) =
      let account = fetchDaleAccount
      let tableClient = account.CreateCloudTableClient()
      let tableName = "Audit" + user
      let table = tableClient.GetTableReference(tableName)
      table.ExecuteQuery(query)
      |> Seq.map (fun e ->
                   { Date = e.PartitionKey;
                     Id = e.RowKey;
                     ServiceType = tryGetKey e "ServiceType";
                     Operation = tryGetKey e "Operation";
                     Status = tryGetKey e "Result";
                     Time = tryGetKey e "Time";
                     ObjectId = tryGetKey e "ObjectId";
                     Json = tryGetKey e "Json"; })
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
      |> Query.where <@ fun g s -> s.PartitionKey = n.UserId && g.RuleName = n.RuleName && g.Status <> Enum.GetName(typeof<Status>,Status.Deleted) @>
      |> fromSentTable

    match notification |> tryCatch fromSentNotifications with
      | Success s -> not (Seq.isEmpty s)
      | Failure f -> true // In case of communication failure, assume it is there


  let pushToAzureStorageQueue (notification :Notification) =
    let io msg =
      let queue = fetchNotificationQueue
      let _ = queue.CreateIfNotExists()
      // Azure Cloud Queue TTL cannot exceed 7 days
      let max = new TimeSpan(7, 0, 0, 0)
      let n = new Nullable<TimeSpan>(max)
      let json = JsonConvert.SerializeObject(msg)
      let m = new CloudQueueMessage(json)
      queue.AddMessage(m, n)
    notification |> tryCatch io


  let postNotification (n :Notification) =
    let io n =
      let _ = Http.Request(Conf.BaseUrl.ToString()+"api/start",
                           httpMethod = "POST",
                           headers = [ ContentType "application/json" ],
                           body = TextRequest (JsonConvert.SerializeObject n))
      ()
    n |> tryCatch io
