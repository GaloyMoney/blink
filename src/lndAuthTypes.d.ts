type nodeType = "offchain" | "onchain"

interface ILndParams {
  cert: string
  macaroon: string
  node: string
  port: string | number
  type: nodeType[]
  pubkey: string
}

interface ILndParamsAuthed extends ILndParams {
  lnd: AuthenticatedLnd
  socket: string
  active: boolean
}
