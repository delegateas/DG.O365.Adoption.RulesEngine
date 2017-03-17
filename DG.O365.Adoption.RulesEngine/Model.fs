namespace DG.O365.Adoption.RulesEngine

  open System
  open System.Runtime.Serialization
  open FSharp.Azure.Storage.Table

  type DocumentationLink = string
  type Message = string
  type UserId = string // Assumed an email at this time

  type Status =
   | Queued = 0
   | Sent = 1
   | Deleted = 2

  [<DataContract>]
  type Rule =
    { [<PartitionKey>]
      [<field: DataMember(Name = "documentationLink")>]
      DocumentationLink :DocumentationLink
      [<RowKey>]
      [<field: DataMember(Name = "name")>]
      Name :string
      [<field: DataMember(Name = "query")>]
      Query :string
      [<field: DataMember(Name = "reducer")>]
      Reducer :string
      [<field: DataMember(Name = "message")>]
      Message :Message
      [<field: DataMember(Name = "receiverObjectId")>]
      ReceiverObjectId :string 
      [<field: DataMember(Name = "receiverName")>]
      ReceiverName :string 
      [<field: DataMember(Name = "isGroup")>]
      IsGroup :int16
      [<field: DataMember(Name = "dialog")>]
      Dialog :string
      }

  [<DataContract>]
  type RuleInvocation =
    { [<field: DataMember(Name = "rule")>]
      Rule :Rule
      [<field: DataMember(Name = "forUser")>]
      ForUser :UserId
      [<field: DataMember(Name = "toUser")>]
      ToUser :UserId }

  type Notification =
    { UserId :UserId
      Message :Message
      DocumentationLink :DocumentationLink 
      TimeSent:string
      DequeueCount:int}

  type AuditEvent =
    { [<PartitionKey>] Date :string
      [<RowKey>] Id :string
      ServiceType :string
      Operation :string
      Status :string
      Time :string
      ObjectId :string
      Json :string }

  [<DataContract>]
  type SentNotification =
    { [<PartitionKey>]
      [<field: DataMember(Name = "userId")>]
      UserId :UserId
      [<RowKey>]
      [<field: DataMember(Name = "timeSent")>]
      TimeSent :string
      [<field: DataMember(Name = "ruleName")>]
      RuleName :string 
      [<field: DataMember(Name = "status")>]
      Status : string }
