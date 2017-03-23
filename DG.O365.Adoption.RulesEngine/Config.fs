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
    appsettings.GetValue(v, typeof<string>).ToString()

  
  type Settings =
   { AzureConnectionString :string
     DaleConnectionString :string
     BaseUrl :string
     Tenant :string
     ClientId :string
     ClientSecret :string
     Resource :string }

  let Conf : Settings =
    { AzureConnectionString = LoadConfigValue "AzureConnectionString";
      DaleConnectionString = LoadConfigValue "DaleConnectionString";
      BaseUrl = LoadConfigValue "BaseUrl";
      Tenant = LoadConfigValue "Tenant";
      ClientId = LoadConfigValue "ClientId";
      ClientSecret = LoadConfigValue "ClientSecret";
      Resource = LoadConfigValue "Resource";
       }  

