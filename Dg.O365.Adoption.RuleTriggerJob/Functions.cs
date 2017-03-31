using System;
using Microsoft.Azure.WebJobs;
using Microsoft.ApplicationInsights;

namespace Dg.O365.Adoption.RuleTriggerJob
{
    public static class Functions
    {
        public static void RuleTriggerJob([TimerTrigger("* */5 * * * *", RunOnStartup = true)] TimerInfo timer)
        {
            try { DG.O365.Adoption.RulesEngine.Engine.trigger();
                Console.WriteLine("success");
            }
            catch (Exception ex) {
                new TelemetryClient().TrackException(ex.InnerException);
                Console.WriteLine(ex.Message);
            }

        }
    }
}
