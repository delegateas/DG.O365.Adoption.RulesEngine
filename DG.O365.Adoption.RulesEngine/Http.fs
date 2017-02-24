namespace DG.O365.Adoption.RulesEngine

module Http =
  open System.Text
  open Suave
  open Suave.Json
  open Suave.RequestErrors
  open Suave.Operators
  open Suave.EventSource
  open Suave.Filters
  open Suave.Successful

  open Engine
  open Storage

  let testRule (rule :RuleInvocation) =
    match handleTestRule rule.ToUser  rule.ForUser rule.Rule with
      | Result.Success s -> ACCEPTED s
      | Result.Failure f -> BAD_REQUEST (f |> Array.reduce (+))


  let postRule (rule :Rule) =
    match addRule rule (Storage.sql.GetDataContext()) with
      | Result.Success _ -> CREATED ""
      | Result.Failure f -> BAD_REQUEST (f |> Array.reduce (+))


  let getRules =
    match getAllRules (Storage.sql.GetDataContext()) with
      | Result.Success s -> OK (Encoding.UTF8.GetString(toJson (s |> Seq.toArray)))
      | Result.Failure f -> BAD_REQUEST (f |> Array.reduce (+))


  let deleteRule (rule : Rule )=
    match deleteRule  rule (Storage.sql.GetDataContext()) with
      | Result.Success s -> OK ""
      | Result.Failure f -> BAD_REQUEST (f |> Array.reduce (+))


  let updateRule (rule : Rule )=
    match updateRule  rule (Storage.sql.GetDataContext()) with
      | Result.Success s -> OK ""
      | Result.Failure f -> BAD_REQUEST (f |> Array.reduce (+))


  let app :WebPart =
    choose [
      path "/" >=> GET >=> Files.file "static/index.html"
      path "/api/testrule" >=>
        POST >=> request (fun r -> (testRule (fromJson r.rawForm)))
      path "/api/rules" >=> choose [
        GET >=> getRules;
        POST >=> request (fun r -> (postRule (fromJson r.rawForm))) ;
        PUT >=> request (fun r -> (updateRule (fromJson r.rawForm))) ;
        DELETE >=> request (fun r -> (deleteRule (fromJson r.rawForm))) ; ]
      GET >=> Files.browseHome
      NOT_FOUND "Found no handlers"
    ]
