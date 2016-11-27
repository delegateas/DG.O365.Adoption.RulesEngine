namespace DG.O365.Adoption.RulesEngine

module Http =
  open System
  open System.Net
  open System.Net.Http
  open System.Net.Http.Formatting
  open System.Net.Http.Headers
  open System.Web.Http
  open System.Web.Http.HttpResource
  open Newtonsoft.Json
  open Frank
  open Model
  open Config
  open Engine

  // Supported formatters for content-negotiation
  let formatters = [| new JsonMediaTypeFormatter() :> MediaTypeFormatter
                      new XmlMediaTypeFormatter() :> MediaTypeFormatter |]

  let testRule (request :HttpRequestMessage) =
    async {
      let json = request.Content.ReadAsStringAsync().Result
      let rule = JsonConvert.DeserializeObject<RuleInvocation>(json)
      handleRule rule.Rule rule.ForUser rule.ToUser
      return new HttpResponseMessage(HttpStatusCode.OK) }

  let testRuleResource = route "/api/testrule" <| post testRule



