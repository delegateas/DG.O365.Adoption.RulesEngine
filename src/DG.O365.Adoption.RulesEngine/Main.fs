namespace DG.O365.Adoption.RulesEngine

module Main =
  open System
  open System.Web.Http.HttpResource
  open System.Web.Http.SelfHost
  open Http
  open Engine
  open Config

  [<EntryPoint>]
  let main args =
    let port =
      match args with
      | [|inport|] -> Int32.Parse(inport)
      | _ -> failwith "There can only be one argument (Port)."

    let baseUri = sprintf "%s%i" "http://localhost:" port 
    let config = new HttpSelfHostConfiguration(baseUri)
    config |> register [ testRuleResource ]

    printfn "Running on %s ..." baseUri
    let server = new HttpSelfHostServer(config)

    printfn "Running engine every %i milliseconds ..." Settings.TimerJobInterval
    let stop = new System.Threading.CancellationTokenSource()
    Async.Start(Engine.runAsync Settings.TimerJobInterval, stop.Token)

    printfn "%s" "Listening ..."
    server.OpenAsync().Wait()

    printfn "%s" "Press any key to stop."
    Console.ReadKey() |> ignore

    stop.Cancel ()
    server.CloseAsync().Wait()
    0
