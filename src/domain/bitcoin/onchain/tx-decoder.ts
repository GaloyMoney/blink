import { toSats } from "@domain/bitcoin"
import { Transaction, networks, address, Network, TxOutput } from "bitcoinjs-lib"

export const TxDecoder = (networkName: BtcNetwork): TxDecoder => {
  const libNetworkName = networkName === "mainnet" ? "bitcoin" : networkName
  const network = networks[libNetworkName]

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

const decodeOutput = (tx: Transaction, network: Network): TxOut[] => {
  const format = (out: TxOutput, network: Network) => {
    let decodedAddress: OnChainAddress | null = null
    try {
      decodedAddress = address.fromOutputScript(out.script, network) as OnChainAddress
    } catch (_) {
      // OP_RETURN outputs don't have a valid address associated with them
    }
    return {
      sats: toSats(out.value),
      address: decodedAddress,
    }
  }

  return tx.outs.map((out) => format(out, network))
}
