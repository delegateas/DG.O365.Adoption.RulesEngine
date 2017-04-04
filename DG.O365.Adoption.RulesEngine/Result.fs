namespace DG.O365.Adoption.RulesEngine

module Result =

  type Result<'TSuccess,'TFailure> =
    | Success of 'TSuccess
    | Failure of 'TFailure



  let bind f =
    fun m ->
      match m with
        | Success s -> f s
        | Failure f -> Failure f


  let (>>=) bind f =
    bind f


  type Error = string[]
  
  let tryCatch fn arg :Result<'T, Error> =
    try
      fn arg |> Success
    with
      | ex -> Failure [|ex.Message|]          
      

  let lift f1 f2 x =
    match f1 x with
      | Success s -> f2 s
      | Failure f -> Failure f


  let (>=>) f1 f2 x =
    lift f1 f2 x
