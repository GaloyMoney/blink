import { toSats } from "@domain/bitcoin"
import { Transaction, networks, address } from "bitcoinjs-lib"

export const MakeTxDecoder = (networkName: BtcNetwork): TxDecoder => {
  const network = networks[networkName]

  const decode = (txHex: string): OnChainTransaction => {
    const tx = Transaction.fromHex(txHex)

    return {
      id: tx.getId() as TxId,
      outs: decodeOutput(tx, network),
      txHex: txHex,
    }
  }

  return {
    decode,
  }
}

const decodeOutput = (tx, network): TxOut[] => {
  const format = (out, n, network) => {
    return {
      sats: toSats(out.value),
      n: n as number,
      address: address.fromOutputScript(out.script, network),
    }
  }

  return tx.outs.map((out, n) => format(out, n, network))
}
