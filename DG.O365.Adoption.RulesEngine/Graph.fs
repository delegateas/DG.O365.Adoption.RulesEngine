namespace DG.O365.Adoption.RulesEngine

module Graph=  
  open System.Text
  open FSharp.Data
  open FSharp.Data.HttpRequestHeaders
  
  //Get user/group information from AAD Graph

  let getRespText body =
      match body with
      | Text t -> t
      | _ -> ""
  
  let fetchAuthToken tenant clientId clientSecret =
    let url = "https://login.microsoftonline.com/" + tenant + "/oauth2/token"
    let resp =
      Http.Request(url, 
                   headers=[Accept "application/json"],
                   body=FormValues ["grant_type", "client_credentials";
                                    "client_id", clientId;
                                    "client_secret", clientSecret;
                                    "resource", "https://graph.windows.net"])
    
    let json = JsonValue.Parse (getRespText resp.Body)
    match resp.StatusCode with
    | 200 -> Some (json.GetProperty("access_token").AsString())
    | _ -> None   

  let getGraphData filter tenant clientId clientsecret =
    let oauthTokenRes = fetchAuthToken tenant (clientId.ToString()) clientsecret
    match oauthTokenRes.IsSome with
    | true -> 
        let url = "https://graph.windows.net/"+Settings.Tenant+"/"+filter+"?api-version=1.6"
        let resp =
           Http.Request(url, httpMethod = "GET",
                   headers = [Authorization ("Bearer " + oauthTokenRes.Value);
                              Accept "application/json"])
        let json = JsonValue.Parse (getRespText resp.Body)
        match resp.StatusCode with
        | 200 -> match filter.Contains("users/") with
                    | true -> json.ToString()  //user query returns only object.
                    | false -> json.GetProperty("value").ToString()
        | _ -> "Error has happened when fetching graphdata"
    | false -> "Error has happend when acquiring token"
