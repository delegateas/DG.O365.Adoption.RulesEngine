namespace DG.O365.Adoption.RulesEngine

module Engine =
  open System
  open Microsoft.WindowsAzure.Storage.Table
  open FSharp.Data
  open Yaaf.FSharp.Scripting
  open Suave.Log
  open Suave.Logging
  open Config
  open Result
  open Storage
  open Graph


  [<Literal>]
  let Script_Input = "input"

  let (|Prefixed|_|) (p:string) (s:string) =
    if s.StartsWith(p) then
        Some(s)
    else
        None

  let queryRuleWorkingSet r (user :string) =
    let u = user.Split [|'@'|] |> Seq.head
    let q = (new TableQuery()).Where(r.Query)
    fromAuditTable u q


  let fetchScript url :Result<string, Error> =
    let resp =
      Http.Request(url, httpMethod = "GET");
    match resp.StatusCode with
    | 200 -> match resp.Body with
             | Text t -> Success (t)
             | _ -> Failure ([|"Script file empty."|])
    | _ -> Failure ([|sprintf "Rule Engine could not reach script at %s" url
                      sprintf "%i: %A" resp.StatusCode resp.Body|])


  let evalExpressionTyped<'T> (fsi :IFsiSession) text =
    let box (session :IFsiSession) t =
      match session.EvalExpression(t) with
      | (value :'T) -> value |> Success

    match tryCatch (box fsi) text with
    | Success s -> s
    | Failure f -> Failure f


  let execF set script :Result<bool, Error> =
    let fsi = ScriptHost.CreateNew()
    fsi.EvalInteraction script
    evalExpressionTyped<bool> fsi (sprintf "rule %A\r\n" set)


  let evalRule r set :Result<bool, Error> =
    match r.Reducer with
    | Prefixed "https://" url  -> fetchScript >=> execF set <| url
    | Prefixed "http://" url -> fetchScript >=> execF set <| url
    | "" -> Success (Array.isEmpty set)
    | _ -> execF set r.Reducer


  // Process rule `forUser`, and if triggered, send a notification `toUser`.
  // In practice, `forUser` and `toUser` should be the same, but that is left
  // up to the caller in order to allow for debugging scenarios.
  // `io` is the side effect to perform when the rule returns true.
  let handleRule io (toUser :string)  (forUser :string) (r :Rule) =
    let timeSent= DateTime.UtcNow.ToString("o")
    let notification:Notification = { DocumentationLink = r.DocumentationLink;
                         UserId = toUser;
                         Message = r.Message;
                         TimeSent = timeSent;
                         DequeueCount = 0;
                         RuleName = r.Name;
                         Dialog = r.Dialog }
    match queryRuleWorkingSet r >=> evalRule r <| forUser with
    | Success b ->
        match b with
        | true -> let status= Enum.GetName(typeof<Status>,Status.Queued) 
                  let sent = { UserId = toUser;
                               TimeSent = timeSent
                               RuleName = r.Name 
                               Status = status}
                  if (not (notificationExists sent))
                    then (match writeNotificationToAzure sent with
                         | Success s ->
                            match io notification with
                            | Success _ ->
                              Success ("Rule triggered.")
                            | Failure f ->
                              Failure (Array.append [|"Could not persist message:"|]  f)
                         | Failure f -> Failure f)
                  else Success ("Rule triggered, but has been sent before.")
        | false -> Success ("Rule did not trigger.")
    | Failure e -> Failure e


  let handleTestRule = handleRule postNotification


  let handleRuleJob = handleRule pushToAzureStorageQueue
  
  let yieldhandleRuleJob (userJson:JsonValue) rule =
    let user= userJson.GetProperty("mail").AsString()
    match user.Contains("@") with
        | true -> handleRuleJob user user rule
        | _ ->  Failure ([|"user has no mail address"|])
   
  
  let triggerJob () =
    let ctx = sql.GetDataContext()
    let rules = match getAllRules  with
                | Failure f ->
                   f
                   |> Seq.map (fun e -> e)
                   |> ignore
                   Seq.empty
                | Success s -> s
    let errors =
      [for rule in rules do
         match rule.IsGroup with 
          | 0s -> //not group
             let userData= getGraphData ("users/"+rule.ReceiverObjectId) Conf.Tenant Conf.ClientId Conf.ClientSecret
             let json = JsonValue.Parse(userData)
             yield yieldhandleRuleJob json rule
                 
          | 1s ->  //group
             let usersList= getGraphData ("groups/"+rule.ReceiverObjectId+"/members") Conf.Tenant Conf.ClientId Conf.ClientSecret
             let users = JsonValue.Parse(usersList).AsArray()
             for u in users do
               yield yieldhandleRuleJob u rule
          | _ -> ()
         ]
      |> Seq.choose (fun r ->
                       match r with
                       | Failure f -> Some f
                       | Success _ -> None)
    if Seq.isEmpty errors then Success () else Failure (errors)

  let trigger () =
    match triggerJob () with
    | Success _ -> ()
    | Failure s -> raise (Exception (Seq.reduce (+) (Seq.concat s)))
 