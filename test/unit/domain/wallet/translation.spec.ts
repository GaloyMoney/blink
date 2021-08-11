import { submittedToWalletTransactions } from "@domain/wallet/transaction-translation"
import { toSats } from "@domain/bitcoin"

describe("submittedToWalletTransactions", () => {
  it("translates submitted txs to wallet txs", () => {
    const timestamp = new Date(Date.now())
    const submittedTransactions: SubmittedTransaction[] = [
      {
        confirmations: 1,
        fee: toSats(1000),
        id: "id" as TxId,
        outputAddresses: ["address1" as OnChainAddress, "address2" as OnChainAddress],
        tokens: toSats(100000),
        rawTx: {
          id: "id" as TxId,
          outs: [
            {
              sats: toSats(25000),
              n: 0,
              address: "address1" as OnChainAddress,
            },
            {
              sats: toSats(75000),
              n: 1,
              address: "address2" as OnChainAddress,
            },
          ],
        },
        createdAt: timestamp,
      },
    ]
    const result = submittedToWalletTransactions(submittedTransactions)
    const expected = [
      {
        id: "id" as TxId,
        settlementVia: "onchain",
        settlementAmount: toSats(25000),
        settlementFee: toSats(0),
        description: "pending",
        pendingConfirmation: true,
        createdAt: timestamp,
        addresses: ["address1" as OnChainAddress],
      },
      {
        id: "id" as TxId,
        settlementVia: "onchain",
        settlementAmount: toSats(75000),
        settlementFee: toSats(0),
        description: "pending",
        pendingConfirmation: true,
        createdAt: timestamp,
        addresses: ["address2" as OnChainAddress],
      },
    ]
    expect(result).toEqual(expected)
  })
})
