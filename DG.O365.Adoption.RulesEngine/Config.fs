namespace DG.O365.Adoption.RulesEngine


module Config =
  open System

  let private env =
    Environment.GetEnvironmentVariables()
    |> Seq.cast<System.Collections.DictionaryEntry>
    |> Seq.map (fun e -> e.Key :?> string, e.Value :?> string)
    |> dict


  let LoadConfigValue v =
    let appsettings = new Configuration.AppSettingsReader()
    let ret =
      match Environment.GetEnvironmentVariable("APPSETTING_" + v) with
      | null -> match Environment.GetEnvironmentVariable(v) with
                | null -> appsettings.GetValue(v, typeof<string>).ToString()
                | s -> s
      | s -> s
    match ret with
    | null -> String.Empty
    | s -> s 


  
  type Settings =
   { AzureConnectionString :string
     DaleConnectionString :string
     NotificationUri :string
     Tenant :string
     ClientId :string
     ClientSecret :string
     Resource :string }

  let Conf : Settings =
    { AzureConnectionString = LoadConfigValue "AzureConnectionString";
      DaleConnectionString = LoadConfigValue "DaleConnectionString";
      NotificationUri = LoadConfigValue "NotificationUri";
      Tenant = LoadConfigValue "Tenant";
      ClientId = LoadConfigValue "ClientId";
      ClientSecret = LoadConfigValue "ClientSecret";
      Resource = LoadConfigValue "Resource";
       }  

