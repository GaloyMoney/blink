import { toSats } from "@domain/bitcoin"
import { TxFilter, IncomingOnChainTransaction } from "@domain/bitcoin/onchain"

describe("TxFilter", () => {
  it("filters greater than equal to confs", () => {
    const filter = TxFilter({ confirmationsGreaterThanOrEqual: 2 })
    const filteredTxs = filter.apply([
      IncomingOnChainTransaction({
        confirmations: 0,
        fee: toSats(1000),
        rawTx: {
          txHash: "txHash1" as OnChainTxHash,
          outs: [
            {
              sats: toSats(1),
              address: "address1" as OnChainAddress,
            },
          ],
        },
        createdAt: new Date(),
      }),
      IncomingOnChainTransaction({
        confirmations: 2,
        fee: toSats(1000),
        rawTx: {
          txHash: "txHash2" as OnChainTxHash,
          outs: [
            {
              sats: toSats(1),
              address: "address2" as OnChainAddress,
            },
          ],
        },
        createdAt: new Date(),
      }),
    ])

    expect(filteredTxs.length).toEqual(1)
  })

  it("filters less than confs", () => {
    const filter = TxFilter({ confirmationsLessThan: 3 })
    const filteredTxs = filter.apply([
      IncomingOnChainTransaction({
        confirmations: 2,
        fee: toSats(1000),
        rawTx: {
          txHash: "txHash1" as OnChainTxHash,
          outs: [
            {
              sats: toSats(1),
              address: "address1" as OnChainAddress,
            },
          ],
        },
        createdAt: new Date(),
      }),
      IncomingOnChainTransaction({
        confirmations: 3,
        fee: toSats(1000),
        rawTx: {
          txHash: "txHash2" as OnChainTxHash,
          outs: [
            {
              sats: toSats(1),
              address: "address2" as OnChainAddress,
            },
          ],
        },
        createdAt: new Date(),
      }),
    ])

    expect(filteredTxs[0].confirmations).toEqual(2)
  })

  it("filters including addresses", () => {
    const filter = TxFilter({ addresses: ["address1" as OnChainAddress] })
    const filteredTxs = filter.apply([
      IncomingOnChainTransaction({
        confirmations: 2,
        fee: toSats(1000),
        rawTx: {
          txHash: "txHash1" as OnChainTxHash,
          outs: [
            {
              sats: toSats(1),
              address: "address1" as OnChainAddress,
            },
          ],
        },
        createdAt: new Date(),
      }),
      IncomingOnChainTransaction({
        confirmations: 3,
        fee: toSats(1000),
        rawTx: {
          txHash: "txHash2" as OnChainTxHash,
          outs: [
            {
              sats: toSats(1),
              address: "address2" as OnChainAddress,
            },
          ],
        },
        createdAt: new Date(),
      }),
    ])

    expect(filteredTxs[0].rawTx.txHash).toEqual("txHash1")
  })
})
