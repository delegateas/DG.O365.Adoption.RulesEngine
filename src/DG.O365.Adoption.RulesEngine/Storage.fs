namespace DG.O365.Adoption.RulesEngine

module Storage =
  open System
  open FSharp.Azure.Storage.Table
  open Microsoft.WindowsAzure.Storage
  open Microsoft.WindowsAzure.Storage.Table
  open Microsoft.WindowsAzure.Storage.Queue
  open Newtonsoft.Json
  open FSharp.Data
  open Config
  open Model

  let fetchAccount =
    let conn = appconfig.Item("AzureConnectionString")
    CloudStorageAccount.Parse conn

  let fetchNotificationQueue =
    let account = fetchAccount
    let queueClient = account.CreateCloudQueueClient()
    queueClient.GetQueueReference("notification-queue")

  let fromAuditTable user q =
    let account = fetchAccount
    let tableClient = account.CreateCloudTableClient()
    let tableName = "Audit" + user
    fromTable tableClient tableName q

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
