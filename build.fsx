﻿// include Fake libs
#r "./packages/FAKE/tools/FakeLib.dll"
#r @"FakeLib.dll"

open Fake
open Fake.Azure
open Fake.EnvironmentHelper
open Fake.StringHelper
open Fake.ConfigurationHelper
open System
open System.IO

Environment.CurrentDirectory <- __SOURCE_DIRECTORY__
let solutionFile = "DG.O365.Adoption.RulesEngine\DG.O365.Adoption.RulesEngine.fsproj"
let sqlConn = environVar "RulesSqlConnectionString"
let webappProj = "./DG.O365.Adoption.RulesEngine/DG.O365.Adoption.RulesEngine.fsproj"

Target "StageWebsiteAssets" (fun _ ->
    let blacklist =
        [ "typings"
          ".fs"
          ".references"
          "tsconfig.json" ]
    let shouldInclude (file:string) =
        blacklist
        |> Seq.forall(not << file.Contains)
    Kudu.stageFolder (Path.GetFullPath @"DG.O365.Adoption.RulesEngine\WebHost") shouldInclude)

Target "BuildSolution" (fun _ ->
    //updateConnectionString "SqlConnectionString" sqlConn "DG.O365.Adoption.RulesEngine\App.config"

    solutionFile
    |> MSBuildHelper.build (fun defaults ->
        { defaults with
            Verbosity = Some Minimal
            Targets = [ "Build" ]
            Properties = [ "Configuration", "Release"
                           "OutputPath", Kudu.deploymentTemp ] })
    |> ignore)

Target "Deploy" Kudu.kuduSync

Target "MSDeploy" (fun _ ->
  webappProj
    |> MSBuildHelper.build (fun defaults ->
        { defaults with
            Verbosity = Some Minimal
            Targets = [ "Build" ]
            Properties = [ "Configuration", "Release"
                           "DeployOnBuild", "true"
                           "PublishProfile", "MSDeploy.pubxml"
                           "ProjectName", "DG.O365.Adoption.RulesEngine.MSDeploy"
                           "ConfigurationName", "Release"
                           "PackageLocation", "../../build/"
                           "OutDir", "../../build/"] })
    |> ignore)


"StageWebsiteAssets"
==> "BuildSolution"
==> "Deploy"

RunTargetOrDefault "Deploy"
