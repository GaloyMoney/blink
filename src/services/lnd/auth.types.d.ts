type NodeType = "offchain" | "onchain"

type LndParams = {
  cert: string
  macaroon: string
  node: string
  port: string | number
  type: NodeType[]
  pubkey: Pubkey
  priority: number
  name: string
}

type LndParamsAuthed = LndParams & {
  lnd: AuthenticatedLnd
  socket: string
  active: boolean
  priority: number
}

type LndParamsUnAuthed = LndParams & {
  lnd: UnauthenticatedLnd
  socket: string
  active: boolean
  priority: number
}

type Macaroon = string & { readonly brand: unique symbol }
