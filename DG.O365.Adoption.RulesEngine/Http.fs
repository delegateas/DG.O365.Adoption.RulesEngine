namespace DG.O365.Adoption.RulesEngine

module Http =
  open Suave
  open Suave.Json
  open Suave.RequestErrors
  open Suave.Operators
  open Suave.EventSource
  open Suave.Filters
  open Suave.Successful

  open Model
  open Engine

  let testRule (rule :RuleInvocation) =
    handleRule rule.Rule rule.ForUser rule.ToUser
    "Rule dispatched."

  let testRuleHandler :WebPart =
    path "/api/testrule" >=> choose [
      POST >=> request (fun r -> OK (testRule (fromJson r.rawForm))) ;
      NOT_FOUND "Found no handlers" ]