CREATE TABLE [dbo].[Rules] (
    [Name]              NVARCHAR (256) NOT NULL,
    [DocumentationLink] NVARCHAR (MAX) NOT NULL,
    [Query]             NVARCHAR (MAX) NOT NULL,
    [Reducer]           NVARCHAR (MAX) NOT NULL,
    [Message]           NVARCHAR (MAX) NOT NULL
);


