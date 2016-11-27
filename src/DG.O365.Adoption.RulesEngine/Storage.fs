namespace DG.O365.Adoption.RulesEngine

module Storage =
  open System
  open FSharp.Azure.Storage.Table
  open Microsoft.WindowsAzure.Storage
  open Microsoft.WindowsAzure.Storage.Table
  open Microsoft.WindowsAzure.Storage.Queue
  open Newtonsoft.Json
  open FSharp.Data
  open FSharp.Data.HttpRequestHeaders
  open Config
  open Model

  let fetchAccount =
    let conn = Settings.AzureConnectionString
    CloudStorageAccount.Parse conn


  let fetchNotificationQueue =
    let account = fetchAccount
    let queueClient = account.CreateCloudQueueClient()
    queueClient.GetQueueReference("notification-queue")


  let fromAuditTable user q =
    let account = fetchAccount
    let tableClient = account.CreateCloudTableClient()
    let tableName = "Audit" + user
    let table = tableClient.GetTableReference(tableName)
    table.ExecuteQuery(q)
    |> Seq.map (fun e ->
                 { Date = e.PartitionKey;
                   Id = e.RowKey;
                   ServiceType = e.Item("ServiceType").ToString();
                   Operation = e.Item("Operation").ToString();
                   Status = e.Item("Result").ToString();
                   Time = e.Item("Time").ToString();
                   ObjectId = e.Item("ObjectId").ToString();
                   Json = e.Item("Json").ToString()
                   })
    |> Seq.toArray


  let queueNotificationToAzure (msgs :Notification[]) =
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


  let postNotification (n :Notification) =
    let _ = Http.Request(Settings.NotificationUri.ToString(), 
                         httpMethod = "POST",
                         headers = [ ContentType "application/json" ],
                         body = TextRequest (JsonConvert.SerializeObject n))
    ()