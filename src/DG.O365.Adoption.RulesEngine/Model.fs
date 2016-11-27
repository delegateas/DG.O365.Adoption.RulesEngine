namespace DG.O365.Adoption.RulesEngine

module Model =
  open FSharp.Azure.Storage.Table

  type DocumentationLink = string
  type Message = string
  type UserId = string // Assumed an email at this time

  type Rule =
    { [<PartitionKey>] DocumentationLink :DocumentationLink
      [<RowKey>] Name :string
      Query :string
      Reducer :string
      Message :Message }

  type RuleInvocation =
    { Rule :Rule
      ForUser :UserId
      ToUser :UserId }

  type Notification =
    { UserId :UserId
      Message :Message
      DocumentationLink :DocumentationLink }

  type AuditEvent =
    { [<PartitionKey>] Date :string
      [<RowKey>] Id :string
      ServiceType :string
      Operation :string
      Status :string
      Time :string
      ObjectId :string
      Json :string }
