CREATE TABLE [dbo].[Rules] (
    [Name]              NVARCHAR (256) NOT NULL,
    [Title] NVARCHAR (MAX) NOT NULL ,
    [Query]             NVARCHAR (MAX) NOT NULL,
    [Reducer]           NVARCHAR (MAX) NULL,
    [Message]           NVARCHAR (MAX) NOT NULL,
    [ReceiverObjectId]  NVARCHAR (256) NOT NULL,
    [ReceiverName]      NVARCHAR (256) NOT NULL,
    [IsGroup]           SMALLINT       DEFAULT ((0)) NOT NULL,
    [Dialog]            NVARCHAR (MAX) NOT NULL,
    CONSTRAINT [PK_Rules] PRIMARY KEY CLUSTERED ([Name] ASC)
);
