type nodeType = "offchain" | "onchain"

type LndParams = {
  cert: string
  macaroon: string
  node: string
  port: string | number
  type: nodeType[]
  pubkey: string
  priority: number
}

type LndParamsAuthed = LndParams & {
  lnd: AuthenticatedLnd
  socket: string
  active: boolean
  priority: number
}
