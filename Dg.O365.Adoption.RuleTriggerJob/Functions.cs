using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Azure.WebJobs;
using System.Net.Http;
using System.Configuration;

namespace Dg.O365.Adoption.RuleTriggerJob
{
    public static class Functions
    {
        private static HttpClient client = new HttpClient();
        public static void StartupJob([TimerTrigger("0 */5 * * * *", RunOnStartup = true)] TimerInfo timer)
        {
            var url = ConfigurationManager.AppSettings["TriggerUrl"];
            client.GetAsync(url);
        }
    }
}
