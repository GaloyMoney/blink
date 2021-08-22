import { toSats } from "@domain/bitcoin"
import { TxFilter } from "@domain/bitcoin/onchain"

describe("TxFilter", () => {
  it("filters greater than equal to confs", () => {
    const filter = TxFilter({ confirmationsGreaterThanOrEqual: 2 })
    const filteredTxs = filter.apply([
      {
        confirmations: 0,
        id: "id" as TxId,
        outputAddresses: ["address"],
        tokens: toSats(10000),
        createdAt: new Date(),
      } as SubmittedTransaction,
      {
        confirmations: 2,
        id: "id" as TxId,
        outputAddresses: ["address"],
        tokens: toSats(10000),
        createdAt: new Date(),
      } as SubmittedTransaction,
    ])

    expect(filteredTxs.length).toEqual(1)
  })

  it("filters less than confs", () => {
    const filter = TxFilter({ confirmationsLessThan: 3 })
    const filteredTxs = filter.apply([
      {
        confirmations: 2,
        id: "id" as TxId,
        outputAddresses: ["address"],
        tokens: toSats(10000),
        createdAt: new Date(),
      } as SubmittedTransaction,
      {
        confirmations: 3,
        id: "id" as TxId,
        outputAddresses: ["address"],
        tokens: toSats(10000),
        createdAt: new Date(),
      } as SubmittedTransaction,
    ])

    expect(filteredTxs[0].confirmations).toEqual(2)
  })

  it("filters including addresses", () => {
    const filter = TxFilter({ addresses: ["address1" as OnChainAddress] })
    const filteredTxs = filter.apply([
      {
        confirmations: 2,
        id: "id" as TxId,
        outputAddresses: ["address1"],
        tokens: toSats(10000),
        createdAt: new Date(),
      } as SubmittedTransaction,
      {
        confirmations: 3,
        id: "id" as TxId,
        outputAddresses: ["address2"],
        tokens: toSats(10000),
        createdAt: new Date(),
      } as SubmittedTransaction,
    ])

    expect(filteredTxs[0].outputAddresses[0]).toEqual("address1")
  })
})
