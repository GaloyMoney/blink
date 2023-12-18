import { Transaction, networks, address, Network, TxOutput } from "bitcoinjs-lib"

import { toSats } from "@/domain/bitcoin"

export const TxDecoder = (networkName: BtcNetwork): TxDecoder => {
  const mapping: { [input in BtcNetwork]: keyof typeof networks } = {
    mainnet: "bitcoin",
    testnet: "testnet",
    signet: "testnet",
    regtest: "regtest",
  }
  const network = networks[mapping[networkName]]

  const decode = (txHex: string): OnChainTransaction => {
    const tx = Transaction.fromHex(txHex)

    return {
      txHash: tx.getId() as OnChainTxHash,
      outs: decodeOutput(tx, network),
    }
  }

  return {
    decode,
  }
}

const decodeOutput = (tx: Transaction, network: Network): TxOut[] => {
  const format = (out: TxOutput, vout: number, network: Network) => {
    let decodedAddress: OnChainAddress | null = null
    try {
      decodedAddress = address.fromOutputScript(out.script, network) as OnChainAddress
    } catch (_) {
      // OP_RETURN outputs don't have a valid address associated with them
    }
    return {
      sats: toSats(out.value),
      address: decodedAddress,
      vout: vout as OnChainTxVout,
    }
  }

  return tx.outs.map((out, index) => format(out, index, network))
}
