CREATE TABLE [dbo].[Rules] (
    [Name]              NVARCHAR (256) NOT NULL,
    [DocumentationLink] NVARCHAR (MAX) NOT NULL,
    [Query]             NVARCHAR (MAX) NOT NULL,
    [Reducer]           NVARCHAR (MAX) NOT NULL,
    [Message]           NVARCHAR (MAX) NOT NULL, 
    [ReceiverObjectId] NVARCHAR(256) NOT NULL, 
    [ReceiverName] NVARCHAR(256) NOT NULL, 
    [IsGroup] SMALLINT NOT NULL DEFAULT 0, 
    [Dialog] NVARCHAR(MAX) NOT NULL, 
    CONSTRAINT [PK_Rules] PRIMARY KEY ([Name])
);

