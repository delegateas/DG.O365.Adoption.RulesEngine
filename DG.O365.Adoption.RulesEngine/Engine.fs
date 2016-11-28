namespace DG.O365.Adoption.RulesEngine

module Engine =
  open FSharp.Azure.Storage.Table
  open Microsoft.WindowsAzure.Storage.Table
  open Model
  open Storage

  let queryRuleWorkingSet r (user :string) =
    let u = user.Split [|'@'|] |> Seq.head
    let q = (new TableQuery()).Where(r.Query)
    fromAuditTable u q


  let evalRule r set =
    // for now, ignore the rule and just return true if the array is empty
    Array.isEmpty set

  // Process rule `forUser`, and if triggered, send a notification `toUser`.
  // In practice, `forUser` and `toUser` should be the same, but that is left
  // up to the caller in order to allow for debugging scenarios. 
  let handleRule (r :Rule)  (forUser :string)  (toUser:string) =
    let items = queryRuleWorkingSet r forUser
    let notification = { DocumentationLink = r.DocumentationLink;
                         UserId = toUser;
                         Message = r.Message}
    match evalRule r items with
      | true -> postNotification notification
      | false -> ()


  let rec jobAsync interval =
   async {
      printfn "%s" "Not yet implemented."
      do! Async.Sleep(interval)
      return! jobAsync interval }


  let runAsync interval =
   async {
      try 
        do! jobAsync interval  
      finally 
        printfn "Rule Engine Job interrupted." }

