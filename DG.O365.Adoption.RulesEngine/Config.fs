namespace DG.O365.Adoption.RulesEngine

[<AutoOpen>]
module Config =
  open System
  open FSharp.Configuration

  type Settings = AppSettings<"app.config">
  let private ACS = "AzureConnectionString"
  let private NURI = "NotificationUri"
  let private INTRVL = "TimerJobInterval"

  let private env =
    Environment.GetEnvironmentVariables()
    |> Seq.cast<System.Collections.DictionaryEntry>
    |> Seq.map (fun e -> e.Key :?> string, e.Value :?> string)
    |> dict

  Settings.AzureConnectionString <- 
    if env.ContainsKey(ACS) then env.Item(ACS) else Settings.AzureConnectionString
  Settings.NotificationUri <- 
    if env.ContainsKey(NURI) then new Uri(env.Item(NURI)) else Settings.NotificationUri
  Settings.TimerJobInterval <- 
    if env.ContainsKey(INTRVL) then Int32.Parse(env.Item(INTRVL)) else Settings.TimerJobInterval