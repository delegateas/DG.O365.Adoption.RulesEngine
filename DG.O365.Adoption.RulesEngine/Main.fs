namespace DG.O365.Adoption.RulesEngine

module Main =
  open System.IO
  open Suave
  open Suave.Log
  open Suave.Logging
  open Http

  [<EntryPoint>]
  let main args =
    let port =  System.UInt16.Parse args.[0]
    let ip = System.Net.IPAddress.Parse "127.0.0.1"
    let logger = Logging.Loggers.saneDefaultsFor Logging.LogLevel.Info
    let serverConfig =
      { Web.defaultConfig with
          homeFolder = Some (Path.GetFullPath "./static")
          logger = logger
          bindings = [ HttpBinding.mk HTTP ip port ] }

    log logger "App" LogLevel.Info (sprintf "Job running every %ims ..."
                                            Settings.TimerJobInterval)
    let stop = new System.Threading.CancellationTokenSource()
    Async.Start(Engine.runAsync Settings.TimerJobInterval logger, stop.Token)
    startWebServer serverConfig app
    0
