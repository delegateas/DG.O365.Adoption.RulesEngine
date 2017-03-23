using System;
using Microsoft.Azure.WebJobs;


namespace Dg.O365.Adoption.RuleTriggerJob
{
    public static class Functions
    {
        public static void RuleTriggerJob([TimerTrigger("*/5 * * * * *", RunOnStartup = true)] TimerInfo timer)
        {
            try { DG.O365.Adoption.RulesEngine.Engine.trigger();
                Console.WriteLine("success");
            }
            catch (Exception ex) {
                Console.WriteLine(ex.Message);
            }

        }
    }
}
