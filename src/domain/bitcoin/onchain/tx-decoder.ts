import { toSats } from "@domain/bitcoin"
import { Transaction, networks, address } from "bitcoinjs-lib"

export const MakeTxDecoder = (networkName: BtcNetwork) => {
  const network = networks[networkName]

  const decode = (txHex: string): OnChainTransaction => {
    const tx = Transaction.fromHex(txHex)

    return {
      id: tx.getId() as TxId,
      outs: decodeOutput(tx, network),
    }
  }

  return {
    decode,
  }
}

const decodeOutput = (tx, network) => {
  var format = (out, n, network) => {
    return {
      sats: toSats(out.value),
      n: n,
      address: address.fromOutputScript(out.script, network),
    }
  }

  return tx.outs.map((out, n) => format(out, n, network))
}
