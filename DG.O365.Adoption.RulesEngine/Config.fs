namespace DG.O365.Adoption.RulesEngine


module Config =
  open System
  open System.Configuration

  let private env =
    Environment.GetEnvironmentVariables()
    |> Seq.cast<System.Collections.DictionaryEntry>
    |> Seq.map (fun e -> e.Key :?> string, e.Value :?> string)
    |> dict

  let LoadConfigValue (v:string) =
    let appsettings = new Configuration.AppSettingsReader()
    let ret =
      match Environment.GetEnvironmentVariable("APPSETTING_" + v) with
      | null -> match Environment.GetEnvironmentVariable(v) with
                | null -> ConfigurationManager.AppSettings.Get(v); 
                | s -> s
      | s -> s
    match ret with
    | null -> String.Empty
    | s -> s 

  type Settings =
   { RuleEngineConnectionString :string
     DaleConnectionString :string
     BaseUrl :string
     Tenant :string
     ClientId :string
     ClientSecret :string
     Resource :string }

  let Conf : Settings =
    { RuleEngineConnectionString = LoadConfigValue "RuleEngineConnectionString";
      DaleConnectionString = LoadConfigValue "DaleConnectionString";
      BaseUrl = LoadConfigValue "BaseUrl";
      Tenant = LoadConfigValue "Tenant";
      ClientId = LoadConfigValue "ClientId";
      ClientSecret = LoadConfigValue "ClientSecret";
      Resource = LoadConfigValue "Resource";
       }  

