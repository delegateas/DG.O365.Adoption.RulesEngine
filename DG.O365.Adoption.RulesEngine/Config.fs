namespace DG.O365.Adoption.RulesEngine

[<AutoOpen>]
module Config =
  open System
  open FSharp.Configuration

  type Settings = AppSettings<"app.config">
  let private ACS = "AzureConnectionString"
  let private NURI = "NotificationUri"
  let private INTRVL = "TimerJobInterval"
  let private TEN = "Tennant"
  let private CID = "ClientId"
  let private CS = "ClientSecret"
  let private RESO = "Resource"

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
  Settings.Tenant <- 
    if env.ContainsKey(TEN) then env.Item(TEN) else Settings.Tenant
  Settings.ClientId <- 
    if env.ContainsKey(CID) then new Guid(env.Item(CID)) else Settings.ClientId
  Settings.ClientSecret <- 
    if env.ContainsKey(CS) then env.Item(CS) else Settings.ClientSecret
  Settings.Resource <- 
    if env.ContainsKey(RESO) then new Uri(env.Item(RESO)) else Settings.Resource