import { LedgerTransactionType, liabilitiesMainAccount } from "@/domain/ledger"
import { translateToLedgerTx } from "@/services/ledger"
import { toObjectId } from "@/services/mongoose/utils"

describe("LedgerService", () => {
  it("translates ILedgerTransaction to LedgerTransaction", () => {
    const sampleId = "62c7e689f846db3305b3b53b"
    const sampleJournalId = "62c7e689f846db3305b3b534"
    const timestamp = new Date()

    const rawTx: ILedgerTransaction = {
      _id: toObjectId(sampleId),
      credit: 0,
      debit: 1000,
      datetime: timestamp,
      account_path: [liabilitiesMainAccount, "walletId"],
      accounts: `${liabilitiesMainAccount}:walletId`,
      book: "MainBook",
      memo: "memo",
      _journal: toObjectId(sampleJournalId),
      timestamp,
      voided: false,

      hash: "hash",
      txid: "txid",
      type: LedgerTransactionType.Payment,
      pending: false,
      currency: "BTC",
      feeKnownInAdvance: true,
      payee_addresses: [],
      memoPayer: "memoPayer",
      sats: 1000,
      username: "username",
      pubkey: "pubkey",

      satsAmount: 1000,
      centsAmount: 20,
      satsFee: 0,
      centsFee: 0,
      displayAmount: 20,
      displayFee: 0,
      displayCurrency: "USD",
    }

    const expectedLedgerTx = {
      id: "62c7e689f846db3305b3b53b",
      walletId: "walletId",
      type: "payment",
      debit: 1000,
      credit: 0,
      currency: "BTC",
      timestamp,
      pendingConfirmation: false,
      journalId: "62c7e689f846db3305b3b534",
      lnMemo: "memo",
      username: "username",
      memoFromPayer: "memoPayer",
      paymentHash: "hash",
      pubkey: "pubkey",
      address: undefined,
      txHash: "hash",
      feeKnownInAdvance: true,

      satsAmount: 1000,
      centsAmount: 20,
      satsFee: 0,
      centsFee: 0,
      displayAmount: 20,
      displayFee: 0,
      displayCurrency: "USD",
    }

    expect(translateToLedgerTx(rawTx)).toEqual(expectedLedgerTx)
  })
})
