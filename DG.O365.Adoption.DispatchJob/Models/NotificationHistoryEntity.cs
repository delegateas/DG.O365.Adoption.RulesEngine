using DG.O365.Adoption.RulesEngine;
using Microsoft.WindowsAzure.Storage.Table;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DG.O365.Adoption.DispatchJob.Models
{
    public class NotificationHistoryEntity : TableEntity
    {
        public NotificationHistoryEntity(string userId, string timeSent)
        {
            this.PartitionKey = userId;
            this.RowKey = timeSent;
        }

        public NotificationHistoryEntity() { }

        public string UserId { get; set; }
        public string TimeSent { get; set; }
        public string RuleName { get; set; }
        public string Status { get; set; }
    }
}

