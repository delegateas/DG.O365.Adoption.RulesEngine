namespace DG.O365.Adoption.RulesEngine

module Engine =
  open FSharp.Azure.Storage.Table
  open Storage
  open Model

//<@ fun g s -> s.PartitionKey = "Valve" && g.HasMultiplayer @>

  let queryRuleWorkingSet (r :Rule, user :string) =
    let q = <@ r.Query @>
    Query.all<AuditEvent>
    |> Query.where q
    |> (fromAuditTable user)
