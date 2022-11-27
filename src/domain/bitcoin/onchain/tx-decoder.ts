import { toSats } from "@domain/bitcoin"
import { Transaction, networks, address, Network, TxOutput } from "bitcoinjs-lib"

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

// FIXME: https://github.com/bitcoinjs/bitcoinjs-lib/issues/1800#issuecomment-1126629937
const wrappedFromOutputScript = (script: Buffer, network: networks.Network) => {
  const oldWarn = console.warn
  console.warn = () => {
    //
  }
  const result = address.fromOutputScript(script, network)
  console.warn = oldWarn
  return result
}

function decodeOutput(tx: Transaction, network: Network): TxOut[] {
  const format = (out: TxOutput, network: Network) => {
    let decodedAddress: OnChainAddress | null = null
    try {
      decodedAddress = wrappedFromOutputScript(out.script, network) as OnChainAddress
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
