namespace DG.O365.Adoption.RulesEngine

module Main =
  open Suave
  open Http
  open Engine

  [<EntryPoint>]
  let main args =
    let port =  System.UInt16.Parse args.[0]
    let ip = System.Net.IPAddress.Parse "127.0.0.1"
    let serverConfig =
      { Web.defaultConfig with
          homeFolder = Some __SOURCE_DIRECTORY__
          logger = Logging.Loggers.saneDefaultsFor Logging.LogLevel.Warn
          bindings = [ HttpBinding.mk HTTP ip port ] }

    printfn "Running engine every %i milliseconds ..." Settings.TimerJobInterval
    let stop = new System.Threading.CancellationTokenSource()
    Async.Start(Engine.runAsync Settings.TimerJobInterval, stop.Token)

    printfn "Running on %s:%i ..." (ip.ToString()) port
    startWebServer serverConfig testRuleHandler
    0