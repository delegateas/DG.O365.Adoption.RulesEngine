namespace DG.O365.Adoption.RulesEngine

module Engine =
  open System
  open System.Runtime.Serialization
  open Microsoft.WindowsAzure.Storage.Table
  open Microsoft.FSharp.Compiler.SourceCodeServices
  open FSharp.Azure.Storage.Table
  open Yaaf.FSharp.Scripting
  open Suave.Log
  open Suave.Logging
  open Result
  open Storage

  [<Literal>]
  let Script_Input = "input"

  let queryRuleWorkingSet r (user :string) =
    let u = user.Split [|'@'|] |> Seq.head
    let q = (new TableQuery()).Where(r.Query)
    fromAuditTable u q


  let execF script set =
    let fsi = ScriptHost.CreateNew()
    let inject = sprintf "let input = %A\r\n" set
    let cmd = inject + script
    match fsi.Handle<bool> fsi.EvalExpression cmd with
    | InvalidExpressionType e ->
      Failure [|(sprintf "Expected type bool but got %A" e.Value)|]
    | InvalidCode e -> Failure [|e.Result.ToString()|]
    | Result r -> Success (r)


  let evalRule r set =
    match r.Reducer with
    | "" -> Success (Array.isEmpty set)
    | _ -> execF r.Reducer set


  // Process rule `forUser`, and if triggered, send a notification `toUser`.
  // In practice, `forUser` and `toUser` should be the same, but that is left
  // up to the caller in order to allow for debugging scenarios.
  let handleRule (r :Rule)  (forUser :string)  (toUser :string) =
    let notification = { DocumentationLink = r.DocumentationLink;
                         UserId = toUser;
                         Message = r.Message }
    let items = queryRuleWorkingSet r forUser

    match items with
      | Success ae ->
        match evalRule r ae with
          | Success b ->
             match b with
               | true ->
                  let sent = { UserId = toUser;
                               TimeSent = DateTime.UtcNow.ToString("s")
                               RuleName = r.Name }
                  if (not (notificationExists sent))
                    then (match writeNotificationToAzure sent with
                         | Success s ->
                            match pushToAzureStorageQueue [|notification|] with
                            | Success _ ->
                              Success ("Rule triggered.")
                            | Failure f ->
                              Failure (Array.append [|"Could not persist message:"|]  f)
                         | Failure f -> Failure f)
                  else Success ("Rule triggered, but has been sent before.")
               | false -> Success ("Rule did not trigger.")
          | Failure e -> Failure e
      | Failure e -> Failure e


  let doJob logger =
    let ctx = sql.GetDataContext()
    let rules = match getAllRules ctx with
                | Failure f ->
                   f
                   |> Seq.map (fun e -> log logger "App" LogLevel.Error e)
                   |> ignore
                   Seq.empty
                | Success s -> s

    let errors =
      [for rule in rules do
          for user in listUsers do
            yield handleRule rule user user]
      |> Seq.choose (fun r ->
                       match r with
                       | Failure f -> Some f
                       | Success _ -> None)
    if Seq.isEmpty errors then Success () else Failure (errors |> Seq.toArray)


  let rec jobAsync interval logger =
   async {
    log logger "App" LogLevel.Info "Starting Job ..."
    match doJob logger with
      | Success _ ->
        log logger "App" LogLevel.Info "Job completed successfully."
      | Failure f ->
        f
        |> Seq.map (fun e ->
                      log logger "App" LogLevel.Error (sprintf "Error: %A" e))
        |> ignore
    log logger "App" LogLevel.Info "Resuming sleep ..."
    do! Async.Sleep(interval)
    return! jobAsync interval logger }


  let runAsync interval logger =
   async {
     try
       do! jobAsync interval logger
     finally
       log logger "App" LogLevel.Fatal "Rule Engine Job interrupted." }
