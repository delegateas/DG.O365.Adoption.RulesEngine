using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Azure.WebJobs;
using DG.O365.Adoption.DispatchJob.Models;
using System.Net.Http;
using Newtonsoft.Json;
using System.Net.Http.Headers;
using System.Configuration;
using Microsoft.WindowsAzure.Storage.Queue;
using Microsoft.WindowsAzure.Storage;
using Microsoft.Azure;
using Microsoft.WindowsAzure.Storage.Table;
using DG.O365.Adoption.RulesEngine;

namespace DG.O365.Adoption.DispatchJob
{
    public class MessageProcessController
    {
        private static HttpClient client = new HttpClient();
        private static string baseUrl = ConfigurationManager.AppSettings["BaseUrl"];
        private static CloudStorageAccount storageAccount = CloudStorageAccount.Parse(
          CloudConfigurationManager.GetSetting("StorageConnectionString"));
        public static async void ProcessQueueMessage([QueueTrigger("notification-queue")] CloudQueueMessage message, TextWriter log)
        {
            CloudQueueClient queueClient = storageAccount.CreateCloudQueueClient();
            CloudQueue queue = queueClient.GetQueueReference("notification-queue");
            queue.CreateIfNotExists();
            Status status = Status.Queued;
            Notification notificationMsg = JsonConvert.DeserializeObject<Notification>(message.AsString);
            try
            {


                var isUserOnline = await CheckAvailablity(notificationMsg.UserId);
                if (notificationMsg.DequeueCount > 5)
                {
                    status = Status.Deleted;
                    //just consume message without do anything.
                }
                else if (isUserOnline)
                {
                    status = Status.Sent;
                    var notification = JsonConvert.SerializeObject(notificationMsg);
                    var buffer = System.Text.Encoding.UTF8.GetBytes(notification);
                    var byteNotification = new ByteArrayContent(buffer);
                    byteNotification.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                    await client.PostAsync(baseUrl + "api/start", byteNotification);
                }
                else
                {
                    status = Status.Queued;
                    var dcount = notificationMsg.DequeueCount;
                    var updatedNotification = new Notification(notificationMsg.UserId, notificationMsg.Message, notificationMsg.DocumentationLink, notificationMsg.TimeSent, dcount + 1,notificationMsg.RuleName,notificationMsg.Dialog);
                    var notification = JsonConvert.SerializeObject(updatedNotification);
                    var buffer = System.Text.Encoding.UTF8.GetBytes(notification);
                    var delay = 10 * (Math.Pow(dcount + 1, dcount));
                    await queue.AddMessageAsync(new CloudQueueMessage(buffer), null, TimeSpan.FromMinutes(delay), null, null);

                }
            }
            catch (Exception ex)
            {
                var notification = JsonConvert.SerializeObject(notificationMsg);
                var buffer = System.Text.Encoding.UTF8.GetBytes(notification);
                await queue.AddMessageAsync(new CloudQueueMessage(buffer), null, TimeSpan.FromMinutes(1), null, null);
                status = Status.Queued;
            }
            UpdateNotificationHistory(notificationMsg, status);

        }
        /// <summary>
        /// Check presence of the user through UCWA
        /// </summary>
        /// <param name="name"></param>
        /// <returns></returns>
        private static async Task<bool> CheckAvailablity(string name)
        {
            var res = await client.GetAsync(baseUrl + "api/presence?sip=" + name);
            var content = await res.Content.ReadAsStringAsync();
            return Boolean.Parse(await res.Content.ReadAsStringAsync());
        }

        /// <summary>
        /// Change the status of the notification hitstory
        /// </summary>
        /// <param name="notification"></param>
        /// <param name="status"></param>
        private static void UpdateNotificationHistory(Notification notification, Status status)
        {
            CloudTableClient tableClient = storageAccount.CreateCloudTableClient();
            CloudTable table = tableClient.GetTableReference("NotificationHistory");
            table.CreateIfNotExists();

            TableOperation retrieveOperation = TableOperation.Retrieve<NotificationHistoryEntity>(notification.UserId, notification.TimeSent);
            TableResult retrievedResult = table.Execute(retrieveOperation);
            NotificationHistoryEntity updateEntity = (NotificationHistoryEntity)retrievedResult.Result;
            if (updateEntity != null)
            {
                updateEntity.Status = Enum.GetName(typeof(Status), status);
                updateEntity.TimeSent = DateTime.UtcNow.ToString("o");
                TableOperation insertOrReplaceOperation = TableOperation.InsertOrReplace(updateEntity);
                table.Execute(insertOrReplaceOperation);
            }
        }
    }
}
