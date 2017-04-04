using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Azure.WebJobs;
using Microsoft.WindowsAzure.Storage;
using Microsoft.Azure;
using Microsoft.WindowsAzure.Storage.Queue;
using System.Threading;
using System.Configuration;

namespace DG.O365.Adoption.DispatchJob
{
    // To learn more about Microsoft Azure WebJobs SDK, please see https://go.microsoft.com/fwlink/?LinkID=320976
    public class Program
    {
        // Please set the following connection strings in app.config for this WebJob to run:
        // AzureWebJobsDashboard and AzureWebJobsStorage
        public static void Main()
        {

            var config = new JobHostConfiguration();
            config.Queues.MaxDequeueCount = 5;

            if (config.IsDevelopment)
            {
                config.UseDevelopmentSettings();
                config.HostId = "testHostId";
            }

            var host = new JobHost();
            // The following code ensures that the WebJob will be running continuously
            host.RunAndBlock();
        }
    }
}
