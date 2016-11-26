namespace DG.O365.Adoption.RulesEngine
module Main =

  open System
  open System.Net
  open System.Net.Http
  open System.Net.Http.Formatting
  open System.Net.Http.Headers
  open System.Web.Http
  open System.Web.Http.HttpResource
  open System.Web.Http.SelfHost
  open Frank
  open FSharp.Control
  open Http

  let baseUri = "http://localhost:8080"
  let config = new HttpSelfHostConfiguration(baseUri)
  config |> register [ helloResource ]

  let server = new HttpSelfHostServer(config)
  server.OpenAsync().Wait()

  printfn "Running on %s ..." baseUri
  printfn "%s" "Press any key to stop."
  Console.ReadKey() |> ignore

  server.CloseAsync().Wait()
