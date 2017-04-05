namespace DG.O365.Adoption.RulesEngine

module Http =
  open System
  open System.Text
  open Suave
  open Suave.Logging
  open Suave.Log
  open Suave.Json
  open Suave.RequestErrors
  open Suave.Operators
  open Suave.EventSource
  open Suave.Filters
  open Suave.Successful
  open FSharp.Data
  open FSharp.Data.HttpRequestHeaders


  open Config
  open Engine
  open Storage
  open Graph

  let testRule (rule :RuleInvocation) =
    match handleTestRule rule.ToUser  rule.ForUser rule.Rule with
      | Result.Success s -> ACCEPTED s
      | Result.Failure f -> BAD_REQUEST (f |> Array.reduce (+))


  let postRule (rule :Rule) =
    match addRule rule with
      | Result.Success _ -> CREATED ""
      | Result.Failure f -> BAD_REQUEST (f |> Array.reduce (+))


  let getRules = warbler(fun _ -> 
    match getAllRules with
      | Result.Success s -> OK (Encoding.UTF8.GetString(toJson (s |> Seq.toArray)))
      | Result.Failure f -> BAD_REQUEST (f |> Array.reduce (+))
      )

  let deleteHandler (rule :Choice<string,string>)=
     match rule with
     | Choice1Of2 s -> 
       match deleteRule s with
       | Result.Success _ -> OK ""
       | Result.Failure f -> BAD_REQUEST ""
     | Choice2Of2 _ -> BAD_REQUEST "Query parameter 'Name' not found."

  let updateRule (rule : Rule )=
    match updateRule  rule  with
      | Result.Success s -> OK ""
      | Result.Failure f -> BAD_REQUEST (f |> Array.reduce (+))
 
  let testDialog (n:TestDialogData) =
    let testNotification:Notification=
     { UserId = n.UserId;
       Message =n.Message;
       Title =n.Title;
       TimeSent = DateTime.UtcNow.ToString("o");
       DequeueCount=0;
       RuleName=n.RuleName;
       Dialog=n.Dialog }
    match postNotification testNotification with
     | Result.Success s -> OK ""
     | Result.Failure f -> BAD_REQUEST(f |> Array.reduce (+))    
  
  let app :WebPart =
    choose [
      path "/" >=> GET >=> Files.file "static/index.html"
      path "/api/groups" >=> 
        GET >=> request (fun r -> OK (getGraphData "groups" Conf.Tenant Conf.ClientId Conf.ClientSecret));
      path "/api/users" >=> 
        GET >=> request (fun r -> OK (getGraphData "users" Conf.Tenant Conf.ClientId Conf.ClientSecret));
      path "/api/testrule" >=>
        POST >=> request (fun r -> (testRule (fromJson r.rawForm)))
      path "/api/testdialog" >=>
        POST >=> request (fun r -> (testDialog (fromJson r.rawForm)))
      path "/api/rules" >=> choose [
        GET >=>  getRules;
        POST >=> request (fun r -> (postRule (fromJson r.rawForm))) ;
        PUT >=> request (fun r -> (updateRule (fromJson r.rawForm))) ;
        DELETE >=> request (fun r -> (deleteHandler (r.queryParam "name"))) ]
      GET >=> Files.browseHome
      NOT_FOUND "Found no handlers"
    ]
