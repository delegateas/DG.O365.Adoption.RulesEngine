using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Azure.WebJobs;
using System.Diagnostics;

namespace Dg.O365.Adoption.RuleTriggerJob
{
    // To learn more about Microsoft Azure WebJobs SDK, please see https://go.microsoft.com/fwlink/?LinkID=320976
    public class Program
    {
        // Please set the following connection strings in app.config for this WebJob to run:
        // AzureWebJobsDashboard and AzureWebJobsStorage
        public static void Main()
        {
            var config = new JobHostConfiguration();
            config.Tracing.ConsoleLevel = TraceLevel.Verbose;

            if (config.IsDevelopment)
            {
                config.UseDevelopmentSettings();
                config.HostId = "baba";
            }
            config.UseTimers();

            var host = new JobHost(config);
            // The following code ensures that the WebJob will be running continuously
            host.RunAndBlock();
        }
    }
}
