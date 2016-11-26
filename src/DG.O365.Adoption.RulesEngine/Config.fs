namespace DG.O365.Adoption.RulesEngine
module Config =

  open System

  let appconfig =
    Environment.GetEnvironmentVariables()
    |> Seq.cast<System.Collections.DictionaryEntry>
    |> Seq.map (fun e -> e.Key :?> string, e.Value :?> string)
    |> dict


  let validateConfig =

    let varNotFound name  =
      printfn "%s %s %s" "Required conf value" name "not set!"
      Environment.Exit(1)

    let ensureVar name =
      match appconfig.ContainsKey(name) with
        | false -> varNotFound name
        | true -> ()

    ensureVar "Port"
    ensureVar "AzureConnectionString"
