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
        public static void StartupJob([TimerTrigger("0 */1 * * * *", RunOnStartup = true)] TimerInfo timer)
        {
            var res=DG.O365.Adoption.RulesEngine.Engine.triggerJob;

        }
    }
}
