namespace DG.O365.Adoption.RulesEngine

module Model =
  open FSharp.Azure.Storage.Table

  type DocumentationLink = string
  type Message = string

  type Rule =
    { [<PartitionKey>] DocumentationLink :DocumentationLink
      [<RowKey>] Name :string
      Query :string
      Reducer :string
      Message :Message }

  type Notification =
    { UserId :string
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
