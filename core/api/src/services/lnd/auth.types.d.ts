type LndNodeType = "offchain" | "onchain"

type LndParams = {
  cert: string
  macaroon: string
  node: string
  port: string | number
  type: LndNodeType[]
  pubkey: Pubkey
  name: string
}

type LndConnect = LndParams & {
  lnd: AuthenticatedLnd
  lndGrpcUnauth: UnauthenticatedLnd
  socket: string
  active: boolean
}

type Macaroon = string & { readonly brand: unique symbol }
