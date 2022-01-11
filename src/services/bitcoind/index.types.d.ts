type BitcoindWalletName = string & { readonly brand: unique symbol }

type WholeBitcoin = number & { readonly brand: unique symbol }

type GetAddressInfoResult = {
  address: string
  scriptPubKey: string
  ismine: boolean
  iswatchonly: boolean
  solvable: boolean
  isscript: boolean
  ischange: boolean
  iswitness: boolean
  // TODO? all avaialable: https://developer.bitcoin.org/reference/rpc/getaddressinfo.html#result
}

type InWalletTransaction = {
  "amount": number
  "fee": number
  "confirmations": number
  "generated": boolean
  "trusted": boolean
  "blockhash": string
  "blockheight": number
  "blockindex": number
  "blocktime": number
  "txid": string
  "time": number
  "timereceived": number
  "comment": string
  "bip125-replaceable": string
  "hex": string
  // TODO? all avaialable: https://developer.bitcoin.org/reference/rpc/gettransaction.html#result
}
