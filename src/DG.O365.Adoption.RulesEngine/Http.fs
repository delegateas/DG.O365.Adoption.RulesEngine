namespace DG.O365.Adoption.RulesEngine
module Http =

  open System
  open System.Globalization
  open System.Net
  open System.Net.Http
  open System.Net.Http.Formatting
  open System.Net.Http.Headers
  open System.Web.Http
  open System.Web.Http.HttpResource
  open Frank

  // Supported formatters for content-negotiation
  let formatters = [| new JsonMediaTypeFormatter() :> MediaTypeFormatter
                      new XmlMediaTypeFormatter() :> MediaTypeFormatter |]

  // Respond with a web page containing "Hello, world!" and a form submission to use the POST method of the resource.
  let helloWorld request =
    respond HttpStatusCode.OK
    <| ``Content-Type`` "text/html"
    <| Some(Formatted (@"<!doctype html>
<meta charset=utf-8>
<title>Hello</title>
<p>Hello, world!
<form action=""/"" method=""post"">
<input type=""hidden"" name=""text"" value=""testing"">
<input type=""submit"">", System.Text.Encoding.UTF8, "text/html"))
  <| request
  |> async.Return

  let echo = runConneg formatters <| fun request -> request.Content.ReadAsStringAsync() |> Async.AwaitTask

  let helloResource = route "/" (get helloWorld <|> post echo)
