/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectEntryToEqual", "expectJournalToBeBalanced"] }] */

import { Entry, IJournal } from "medici"

import { WalletCurrency, AmountCalculator, ZERO_BANK_FEE } from "@/domain/shared"

import {
  lndLedgerAccountUuid,
  EntryBuilder,
  onChainLedgerAccountUuid,
} from "@/services/ledger/domain"
import { MainBook } from "@/services/ledger/books"
import { UsdDisplayCurrency } from "@/domain/fiat"

const createEntry = () => MainBook.entry("")

type DisplayAmountsArg = {
  displayAmount: DisplayCurrencyBaseAmount
  displayFee: DisplayCurrencyBaseAmount
  displayCurrency: DisplayCurrency
}

describe("EntryBuilder", () => {
  const findEntry = (txs: ILedgerTransaction[], account: string): ILedgerTransaction => {
    const entry = txs.find((tx) => tx.accounts === account)
    if (!entry) throw new Error("Invalid entry")
    return entry
  }

  const expectEntryToEqual = (
    entry: ILedgerTransaction,
    amount: Amount<WalletCurrency>,
  ) => {
    expect(entry.debit + entry.credit).toEqual(Number(amount.amount))
    expect(entry.currency).toEqual(amount.currency)
  }

  const testEntryDisplayAmounts = (
    entry: Entry<ILedgerTransaction, IJournal>,
    displayAmounts: {
      walletAmounts: DisplayAmountsArg
      senderAmounts: DisplayAmountsArg
      recipientAmounts: DisplayAmountsArg
    },
  ) => {
    const { transactions } = entry
    const internalEntries = transactions.filter(({ accounts }) =>
      Object.values(staticAccountUuids).includes(accounts as LedgerAccountUuid),
    )
    for (const entry of internalEntries) {
      expect(entry).toEqual(expect.objectContaining(displayAmounts.walletAmounts))
    }

    const userEntries = transactions.filter(
      ({ accounts }) =>
        !Object.values(staticAccountUuids).includes(accounts as LedgerAccountUuid),
    )
    expect(userEntries.length).toBeGreaterThanOrEqual(0)
    expect(userEntries.length).toBeLessThanOrEqual(2)

    const userDebits = userEntries.filter(({ debit }) => debit > 0)
    expect(userDebits.length).toBeLessThanOrEqual(1)
    if (userDebits.length) {
      expect(userDebits[0]).toEqual(expect.objectContaining(displayAmounts.senderAmounts))
    }

    const userCredits = userEntries.filter(({ credit }) => credit > 0)
    expect(userCredits.length).toBeLessThanOrEqual(1)
    if (userCredits.length) {
      expect(userCredits[0]).toEqual(
        expect.objectContaining(displayAmounts.recipientAmounts),
      )
    }
  }

  const expectJournalToBeBalanced = (journal: MediciEntry) => {
    let usdCredits = 0
    let btcCredits = 0
    let usdDebits = 0
    let btcDebits = 0

    const credits = journal.transactions.filter((t) => t.credit > 0)
    const debits = journal.transactions.filter((t) => t.debit > 0)
    const zeroAmounts = journal.transactions.filter(
      (t) => t.debit === 0 && t.credit === 0,
    )

    // eslint-disable-next-line
    Object.values<any>(debits).forEach((entry) =>
      entry.currency === WalletCurrency.Usd
        ? (usdDebits += entry.amount)
        : (btcDebits += entry.amount),
    )
    // eslint-disable-next-line
    Object.values<any>(credits).forEach((entry) =>
      entry.currency === WalletCurrency.Usd
        ? (usdCredits += entry.amount)
        : (btcCredits += entry.amount),
    )

    expect(usdCredits).toEqual(usdDebits)
    expect(btcCredits).toEqual(btcDebits)
    expect(zeroAmounts.length).toBe(0)
  }

  const calc = AmountCalculator()
  const staticAccountUuids = {
    bankOwnerAccountUuid: "bankOwnerAccountUuid" as LedgerAccountUuid,
    dealerBtcAccountUuid: "dealerBtcAccountUuid" as LedgerAccountUuid,
    dealerUsdAccountUuid: "dealerUsdAccountUuid" as LedgerAccountUuid,
    lightningAccountUuid: "Assets:Reserve:Lightning" as LedgerAccountUuid,
    onchainAccountUuid: "Assets:OnChain" as LedgerAccountUuid,
  }
  const debitorAccountUuid = "debitorAccountUuid" as LedgerAccountUuid
  const btcDebitorAccountDescriptor = {
    id: debitorAccountUuid,
    currency: WalletCurrency.Btc,
  } as LedgerAccountDescriptor<"BTC">

  const usdDebitorAccountDescriptor = {
    id: debitorAccountUuid,
    currency: WalletCurrency.Usd,
  } as LedgerAccountDescriptor<"USD">

  const creditorAccountUuid = "creditorAccountUuid" as LedgerAccountUuid

  const btcCreditorAccountDescriptor = {
    id: creditorAccountUuid,
    currency: WalletCurrency.Btc,
  } as LedgerAccountDescriptor<"BTC">

  const usdCreditorAccountDescriptor = {
    id: creditorAccountUuid,
    currency: WalletCurrency.Usd,
  } as LedgerAccountDescriptor<"USD">

  const btcAmount = {
    currency: WalletCurrency.Btc,
    amount: 2000n,
  }
  const usdAmount = {
    currency: WalletCurrency.Usd,
    amount: 20n,
  }

  const amount = {
    btcWithFees: btcAmount,
    usdWithFees: usdAmount,
  }
  const btcFee = {
    currency: WalletCurrency.Btc,
    amount: 110n,
  }
  const usdFee = {
    currency: WalletCurrency.Usd,
    amount: 1n,
  }

  const bankFee = {
    usdBankFee: usdFee,
    btcBankFee: btcFee,
  }

  const metadata = {
    memo: "memo",
    memoPayer: "memoPayer",
    currency: "BAD CURRENCY",
    some: "some",
    more: "more",
  }

  const additionalInternalMetadata = {
    displayAmount: 20 as DisplayCurrencyBaseAmount,
    displayFee: 0 as DisplayCurrencyBaseAmount,
    displayCurrency: UsdDisplayCurrency,
  }

  const additionalUserUsdMetadata = {
    displayAmount: 22 as DisplayCurrencyBaseAmount,
    displayFee: 0 as DisplayCurrencyBaseAmount,
    displayCurrency: UsdDisplayCurrency,
  }

  const additionalUserEurMetadata = {
    displayAmount: 25 as DisplayCurrencyBaseAmount,
    displayFee: 0 as DisplayCurrencyBaseAmount,
    displayCurrency: "EUR" as DisplayCurrency,
  }

  describe("Btc account", () => {
    describe("send", () => {
      describe("offchain", () => {
        it("without fee", () => {
          const entry = createEntry()
          const builder = EntryBuilder({
            staticAccountUuids,
            entry,
            metadata,
            additionalInternalMetadata,
          })
          const result = builder
            .withTotalAmount(amount)
            .withBankFee(ZERO_BANK_FEE)
            .debitAccount({
              accountDescriptor: btcDebitorAccountDescriptor,
              additionalMetadata: additionalUserUsdMetadata,
            })
            .creditOffChain()

          const credits = result.transactions.filter((t) => t.credit > 0)
          const debits = result.transactions.filter((t) => t.debit > 0)

          expectJournalToBeBalanced(result)
          testEntryDisplayAmounts(entry, {
            walletAmounts: additionalInternalMetadata,
            senderAmounts: additionalUserUsdMetadata,
            recipientAmounts: additionalUserEurMetadata,
          })
          expectEntryToEqual(findEntry(credits, lndLedgerAccountUuid), btcAmount)
          expectEntryToEqual(findEntry(debits, debitorAccountUuid), btcAmount)
          expect(
            debits.find((tx) => tx.accounts === staticAccountUuids.bankOwnerAccountUuid),
          ).toBeUndefined()
        })

        it("with fee", () => {
          const entry = createEntry()
          const builder = EntryBuilder({
            staticAccountUuids,
            entry,
            metadata,
            additionalInternalMetadata,
          })
          const result = builder
            .withTotalAmount(amount)
            .withBankFee(bankFee)
            .debitAccount({
              accountDescriptor: btcDebitorAccountDescriptor,
              additionalMetadata: additionalUserUsdMetadata,
            })
            .creditOffChain()

          const credits = result.transactions.filter((t) => t.credit > 0)
          const debits = result.transactions.filter((t) => t.debit > 0)

          expectJournalToBeBalanced(result)
          testEntryDisplayAmounts(entry, {
            walletAmounts: additionalInternalMetadata,
            senderAmounts: additionalUserUsdMetadata,
            recipientAmounts: additionalUserEurMetadata,
          })
          expectEntryToEqual(
            findEntry(credits, staticAccountUuids.bankOwnerAccountUuid),
            btcFee,
          )
          expectEntryToEqual(
            findEntry(credits, lndLedgerAccountUuid),
            calc.sub(btcAmount, btcFee),
          )
          expectEntryToEqual(findEntry(debits, debitorAccountUuid), btcAmount)
        })
      })
      describe("onchain", () => {
        it("without fee", () => {
          const entry = createEntry()
          const builder = EntryBuilder({
            staticAccountUuids,
            entry,
            metadata,
            additionalInternalMetadata,
          })
          const result = builder
            .withTotalAmount(amount)
            .withBankFee(ZERO_BANK_FEE)
            .debitAccount({
              accountDescriptor: btcDebitorAccountDescriptor,
              additionalMetadata: additionalUserUsdMetadata,
            })
            .creditOnChain()

          const credits = result.transactions.filter((t) => t.credit > 0)
          const debits = result.transactions.filter((t) => t.debit > 0)

          expectJournalToBeBalanced(result)
          testEntryDisplayAmounts(entry, {
            walletAmounts: additionalInternalMetadata,
            senderAmounts: additionalUserUsdMetadata,
            recipientAmounts: additionalUserEurMetadata,
          })
          expectEntryToEqual(findEntry(credits, onChainLedgerAccountUuid), btcAmount)
          expectEntryToEqual(findEntry(debits, debitorAccountUuid), btcAmount)
          expect(
            debits.find((tx) => tx.accounts === staticAccountUuids.bankOwnerAccountUuid),
          ).toBeUndefined()
        })

        it("with fee", () => {
          const entry = createEntry()
          const builder = EntryBuilder({
            staticAccountUuids,
            entry,
            metadata,
            additionalInternalMetadata,
          })
          const result = builder
            .withTotalAmount(amount)
            .withBankFee(bankFee)
            .debitAccount({
              accountDescriptor: btcDebitorAccountDescriptor,
              additionalMetadata: additionalUserUsdMetadata,
            })
            .creditOnChain()

          const credits = result.transactions.filter((t) => t.credit > 0)
          const debits = result.transactions.filter((t) => t.debit > 0)

          expectJournalToBeBalanced(result)
          testEntryDisplayAmounts(entry, {
            walletAmounts: additionalInternalMetadata,
            senderAmounts: additionalUserUsdMetadata,
            recipientAmounts: additionalUserEurMetadata,
          })
          expectEntryToEqual(
            findEntry(credits, staticAccountUuids.bankOwnerAccountUuid),
            btcFee,
          )
          expectEntryToEqual(
            findEntry(credits, onChainLedgerAccountUuid),
            calc.sub(btcAmount, btcFee),
          )
          expectEntryToEqual(findEntry(debits, debitorAccountUuid), btcAmount)
        })
      })
    })

    describe("receive", () => {
      it("without fee", () => {
        const entry = createEntry()
        const builder = EntryBuilder({
          staticAccountUuids,
          entry,
          metadata,
          additionalInternalMetadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withBankFee(ZERO_BANK_FEE)
          .debitLnd()
          .creditAccount({
            accountDescriptor: btcCreditorAccountDescriptor,
            additionalMetadata: additionalUserEurMetadata,
          })

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)

        expectJournalToBeBalanced(result)
        testEntryDisplayAmounts(entry, {
          walletAmounts: additionalInternalMetadata,
          senderAmounts: additionalUserUsdMetadata,
          recipientAmounts: additionalUserEurMetadata,
        })
        expectEntryToEqual(findEntry(debits, lndLedgerAccountUuid), btcAmount)
        expectEntryToEqual(findEntry(credits, creditorAccountUuid), btcAmount)
      })

      it("with fee", () => {
        const entry = createEntry()
        const builder = EntryBuilder({
          staticAccountUuids,
          entry,
          metadata,
          additionalInternalMetadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withBankFee(bankFee)
          .debitLnd()
          .creditAccount({
            accountDescriptor: btcCreditorAccountDescriptor,
            additionalMetadata: additionalUserEurMetadata,
          })

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)
        expectJournalToBeBalanced(result)
        testEntryDisplayAmounts(entry, {
          walletAmounts: additionalInternalMetadata,
          senderAmounts: additionalUserUsdMetadata,
          recipientAmounts: additionalUserEurMetadata,
        })
        expect(
          findEntry(credits, staticAccountUuids.bankOwnerAccountUuid).credit,
        ).toEqual(Number(btcFee.amount))
        expectEntryToEqual(findEntry(debits, lndLedgerAccountUuid), btcAmount)
        expectEntryToEqual(
          findEntry(credits, creditorAccountUuid),
          calc.sub(btcAmount, btcFee),
        )
      })
    })
  })

  describe("Usd account", () => {
    describe("send", () => {
      describe("offchain", () => {
        it("without fee", () => {
          const entry = createEntry()
          const builder = EntryBuilder({
            staticAccountUuids,
            entry,
            metadata,
            additionalInternalMetadata,
          })
          const result = builder
            .withTotalAmount(amount)
            .withBankFee(ZERO_BANK_FEE)
            .debitAccount({
              accountDescriptor: usdDebitorAccountDescriptor,
              additionalMetadata: additionalUserUsdMetadata,
            })
            .creditOffChain()

          const credits = result.transactions.filter((t) => t.credit > 0)
          const debits = result.transactions.filter((t) => t.debit > 0)

          expectJournalToBeBalanced(result)
          testEntryDisplayAmounts(entry, {
            walletAmounts: additionalInternalMetadata,
            senderAmounts: additionalUserUsdMetadata,
            recipientAmounts: additionalUserEurMetadata,
          })
          expectEntryToEqual(findEntry(credits, lndLedgerAccountUuid), btcAmount)
          expectEntryToEqual(findEntry(debits, debitorAccountUuid), usdAmount)
          expectEntryToEqual(
            findEntry(debits, staticAccountUuids.dealerBtcAccountUuid),
            btcAmount,
          )
          expect(
            credits.find((tx) => tx.accounts === staticAccountUuids.dealerBtcAccountUuid),
          ).toBeUndefined()
          expectEntryToEqual(
            findEntry(credits, staticAccountUuids.dealerUsdAccountUuid),
            usdAmount,
          )
          expect(
            debits.find((tx) => tx.accounts === staticAccountUuids.dealerUsdAccountUuid),
          ).toBeUndefined()
        })

        it("with fee", () => {
          const entry = createEntry()
          const builder = EntryBuilder({
            staticAccountUuids,
            entry,
            metadata,
            additionalInternalMetadata,
          })
          const result = builder
            .withTotalAmount(amount)
            .withBankFee(bankFee)
            .debitAccount({
              accountDescriptor: usdDebitorAccountDescriptor,
              additionalMetadata: additionalUserUsdMetadata,
            })
            .creditOffChain()

          const credits = result.transactions.filter((t) => t.credit > 0)
          const debits = result.transactions.filter((t) => t.debit > 0)

          testEntryDisplayAmounts(entry, {
            walletAmounts: additionalInternalMetadata,
            senderAmounts: additionalUserUsdMetadata,
            recipientAmounts: additionalUserEurMetadata,
          })

          expectJournalToBeBalanced(result)
          testEntryDisplayAmounts(entry, {
            walletAmounts: additionalInternalMetadata,
            senderAmounts: additionalUserUsdMetadata,
            recipientAmounts: additionalUserEurMetadata,
          })
          expectEntryToEqual(
            findEntry(credits, lndLedgerAccountUuid),
            calc.sub(btcAmount, btcFee),
          )
          expectEntryToEqual(
            findEntry(credits, staticAccountUuids.bankOwnerAccountUuid),
            btcFee,
          )
          expectEntryToEqual(findEntry(debits, debitorAccountUuid), usdAmount)
          expectEntryToEqual(
            findEntry(debits, staticAccountUuids.dealerBtcAccountUuid),
            btcAmount,
          )
          expect(
            credits.find((tx) => tx.accounts === staticAccountUuids.dealerBtcAccountUuid),
          ).toBeUndefined()
          expectEntryToEqual(
            findEntry(credits, staticAccountUuids.dealerUsdAccountUuid),
            usdAmount,
          )
          expect(
            debits.find((tx) => tx.accounts === staticAccountUuids.dealerUsdAccountUuid),
          ).toBeUndefined()
        })
      })
      describe("onchain", () => {
        it("without fee", () => {
          const entry = createEntry()
          const builder = EntryBuilder({
            staticAccountUuids,
            entry,
            metadata,
            additionalInternalMetadata,
          })
          const result = builder
            .withTotalAmount(amount)
            .withBankFee(ZERO_BANK_FEE)
            .debitAccount({
              accountDescriptor: usdDebitorAccountDescriptor,
              additionalMetadata: additionalUserUsdMetadata,
            })
            .creditOnChain()

          const credits = result.transactions.filter((t) => t.credit > 0)
          const debits = result.transactions.filter((t) => t.debit > 0)

          expectJournalToBeBalanced(result)
          testEntryDisplayAmounts(entry, {
            walletAmounts: additionalInternalMetadata,
            senderAmounts: additionalUserUsdMetadata,
            recipientAmounts: additionalUserEurMetadata,
          })
          expectEntryToEqual(findEntry(credits, onChainLedgerAccountUuid), btcAmount)
          expectEntryToEqual(findEntry(debits, debitorAccountUuid), usdAmount)
          expectEntryToEqual(
            findEntry(debits, staticAccountUuids.dealerBtcAccountUuid),
            btcAmount,
          )
          expect(
            credits.find((tx) => tx.accounts === staticAccountUuids.dealerBtcAccountUuid),
          ).toBeUndefined()
          expectEntryToEqual(
            findEntry(credits, staticAccountUuids.dealerUsdAccountUuid),
            usdAmount,
          )
          expect(
            debits.find((tx) => tx.accounts === staticAccountUuids.dealerUsdAccountUuid),
          ).toBeUndefined()
        })

        it("with fee", () => {
          const entry = createEntry()
          const builder = EntryBuilder({
            staticAccountUuids,
            entry,
            metadata,
            additionalInternalMetadata,
          })
          const result = builder
            .withTotalAmount(amount)
            .withBankFee(bankFee)
            .debitAccount({
              accountDescriptor: usdDebitorAccountDescriptor,
              additionalMetadata: additionalUserUsdMetadata,
            })
            .creditOnChain()

          const credits = result.transactions.filter((t) => t.credit > 0)
          const debits = result.transactions.filter((t) => t.debit > 0)

          testEntryDisplayAmounts(entry, {
            walletAmounts: additionalInternalMetadata,
            senderAmounts: additionalUserUsdMetadata,
            recipientAmounts: additionalUserEurMetadata,
          })

          expectJournalToBeBalanced(result)
          testEntryDisplayAmounts(entry, {
            walletAmounts: additionalInternalMetadata,
            senderAmounts: additionalUserUsdMetadata,
            recipientAmounts: additionalUserEurMetadata,
          })
          expectEntryToEqual(
            findEntry(credits, onChainLedgerAccountUuid),
            calc.sub(btcAmount, btcFee),
          )
          expectEntryToEqual(
            findEntry(credits, staticAccountUuids.bankOwnerAccountUuid),
            btcFee,
          )
          expectEntryToEqual(findEntry(debits, debitorAccountUuid), usdAmount)
          expectEntryToEqual(
            findEntry(debits, staticAccountUuids.dealerBtcAccountUuid),
            btcAmount,
          )
          expect(
            credits.find((tx) => tx.accounts === staticAccountUuids.dealerBtcAccountUuid),
          ).toBeUndefined()
          expectEntryToEqual(
            findEntry(credits, staticAccountUuids.dealerUsdAccountUuid),
            usdAmount,
          )
          expect(
            debits.find((tx) => tx.accounts === staticAccountUuids.dealerUsdAccountUuid),
          ).toBeUndefined()
        })
      })
    })

    describe("receive", () => {
      describe("without fee", () => {
        it("handles txn with btc amount & usd amount", () => {
          const entry = createEntry()
          const builder = EntryBuilder({
            staticAccountUuids,
            entry,
            metadata,
            additionalInternalMetadata,
          })

          const result = builder
            .withTotalAmount(amount)
            .withBankFee(ZERO_BANK_FEE)
            .debitLnd()
            .creditAccount({
              accountDescriptor: usdCreditorAccountDescriptor,
              additionalMetadata: additionalUserEurMetadata,
            })

          const credits = result.transactions.filter((t) => t.credit > 0)
          const debits = result.transactions.filter((t) => t.debit > 0)

          expectJournalToBeBalanced(result)
          testEntryDisplayAmounts(entry, {
            walletAmounts: additionalInternalMetadata,
            senderAmounts: additionalUserUsdMetadata,
            recipientAmounts: additionalUserEurMetadata,
          })
          expectEntryToEqual(findEntry(debits, lndLedgerAccountUuid), btcAmount)
          expectEntryToEqual(findEntry(credits, creditorAccountUuid), usdAmount)
          expectEntryToEqual(
            findEntry(credits, staticAccountUuids.dealerBtcAccountUuid),
            btcAmount,
          )
          expect(
            debits.find((tx) => tx.accounts === staticAccountUuids.dealerBtcAccountUuid),
          ).toBeUndefined()
          expectEntryToEqual(
            findEntry(debits, staticAccountUuids.dealerUsdAccountUuid),
            usdAmount,
          )
          expect(
            credits.find((tx) => tx.accounts === staticAccountUuids.dealerUsdAccountUuid),
          ).toBeUndefined()
        })

        // e.g. a `recordReceive' fee-reimbursement with low sats amount
        it("handles txn with btc amount & zero usd amount", () => {
          const btcAmount = {
            currency: WalletCurrency.Btc,
            amount: 18n,
          }
          const usdAmount = {
            currency: WalletCurrency.Usd,
            amount: 0n,
          }

          const amount = {
            btcWithFees: btcAmount,
            usdWithFees: usdAmount,
          }

          const entry = createEntry()
          const builder = EntryBuilder({
            staticAccountUuids,
            entry,
            metadata,
            additionalInternalMetadata,
          })

          const result = builder
            .withTotalAmount(amount)
            .withBankFee(ZERO_BANK_FEE)
            .debitLnd()
            .creditAccount({
              accountDescriptor: usdCreditorAccountDescriptor,
              additionalMetadata: additionalUserEurMetadata,
            })

          const credits = result.transactions.filter((t) => t.credit > 0)
          const debits = result.transactions.filter((t) => t.debit > 0)
          expectJournalToBeBalanced(result)
          testEntryDisplayAmounts(entry, {
            walletAmounts: additionalInternalMetadata,
            senderAmounts: additionalUserUsdMetadata,
            recipientAmounts: additionalUserEurMetadata,
          })
          expectEntryToEqual(findEntry(debits, lndLedgerAccountUuid), btcAmount)
          expect(
            credits.find((tx) => tx.accounts === creditorAccountUuid),
          ).toBeUndefined()
          expectEntryToEqual(
            findEntry(credits, staticAccountUuids.dealerBtcAccountUuid),
            btcAmount,
          )
          expect(
            debits.find((tx) => tx.accounts === staticAccountUuids.dealerBtcAccountUuid),
          ).toBeUndefined()
          expect(
            debits.find((tx) => tx.accounts === staticAccountUuids.dealerUsdAccountUuid),
          ).toBeUndefined()
          expect(
            credits.find((tx) => tx.accounts === staticAccountUuids.dealerUsdAccountUuid),
          ).toBeUndefined()
        })
      })

      it("with fee", () => {
        const entry = createEntry()
        const builder = EntryBuilder({
          staticAccountUuids,
          entry,
          metadata,
          additionalInternalMetadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withBankFee(bankFee)
          .debitLnd()
          .creditAccount({
            accountDescriptor: usdCreditorAccountDescriptor,
            additionalMetadata: additionalUserEurMetadata,
          })

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)

        expectJournalToBeBalanced(result)
        testEntryDisplayAmounts(entry, {
          walletAmounts: additionalInternalMetadata,
          senderAmounts: additionalUserUsdMetadata,
          recipientAmounts: additionalUserEurMetadata,
        })
        expectEntryToEqual(findEntry(debits, lndLedgerAccountUuid), btcAmount)
        expectEntryToEqual(
          findEntry(credits, creditorAccountUuid),
          calc.sub(usdAmount, usdFee),
        )
        expectEntryToEqual(
          findEntry(credits, staticAccountUuids.dealerBtcAccountUuid),
          calc.sub(btcAmount, btcFee),
        )
        expect(
          debits.find((tx) => tx.accounts === staticAccountUuids.dealerBtcAccountUuid),
        ).toBeUndefined()
        expectEntryToEqual(
          findEntry(debits, staticAccountUuids.dealerUsdAccountUuid),
          calc.sub(usdAmount, usdFee),
        )
        expect(
          credits.find((tx) => tx.accounts === staticAccountUuids.dealerUsdAccountUuid),
        ).toBeUndefined()
      })
    })
  })

  describe("intra ledger", () => {
    describe("from btc", () => {
      it("to btc", () => {
        const entry = createEntry()
        const builder = EntryBuilder({
          staticAccountUuids,
          entry,
          metadata,
          additionalInternalMetadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withBankFee(ZERO_BANK_FEE)
          .debitAccount({
            accountDescriptor: btcDebitorAccountDescriptor,
            additionalMetadata: additionalUserUsdMetadata,
          })
          .creditAccount({
            accountDescriptor: btcCreditorAccountDescriptor,
            additionalMetadata: additionalUserEurMetadata,
          })

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)
        expectEntryToEqual(findEntry(credits, creditorAccountUuid), btcAmount)
        expectEntryToEqual(findEntry(debits, debitorAccountUuid), btcAmount)
      })

      it("to usd", () => {
        const entry = createEntry()
        const builder = EntryBuilder({
          staticAccountUuids,
          entry,
          metadata,
          additionalInternalMetadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withBankFee(ZERO_BANK_FEE)
          .debitAccount({
            accountDescriptor: btcDebitorAccountDescriptor,
            additionalMetadata: additionalUserUsdMetadata,
          })
          .creditAccount({
            accountDescriptor: usdCreditorAccountDescriptor,
            additionalMetadata: additionalUserEurMetadata,
          })

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)

        expectJournalToBeBalanced(result)
        testEntryDisplayAmounts(entry, {
          walletAmounts: additionalInternalMetadata,
          senderAmounts: additionalUserUsdMetadata,
          recipientAmounts: additionalUserEurMetadata,
        })
        expectEntryToEqual(findEntry(credits, creditorAccountUuid), usdAmount)
        expectEntryToEqual(findEntry(debits, debitorAccountUuid), btcAmount)
        expectEntryToEqual(
          findEntry(credits, staticAccountUuids.dealerBtcAccountUuid),
          btcAmount,
        )
        expect(
          debits.find((tx) => tx.accounts === staticAccountUuids.dealerBtcAccountUuid),
        ).toBeUndefined()
        expectEntryToEqual(
          findEntry(debits, staticAccountUuids.dealerUsdAccountUuid),
          usdAmount,
        )
        expect(
          credits.find((tx) => tx.accounts === staticAccountUuids.dealerUsdAccountUuid),
        ).toBeUndefined()
      })
    })
    describe("from usd", () => {
      it("to btc", () => {
        const entry = createEntry()
        const builder = EntryBuilder({
          staticAccountUuids,
          entry,
          metadata,
          additionalInternalMetadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withBankFee(ZERO_BANK_FEE)
          .debitAccount({
            accountDescriptor: usdDebitorAccountDescriptor,
            additionalMetadata: additionalUserUsdMetadata,
          })
          .creditAccount({
            accountDescriptor: btcCreditorAccountDescriptor,
            additionalMetadata: additionalUserEurMetadata,
          })

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)

        expectJournalToBeBalanced(result)
        testEntryDisplayAmounts(entry, {
          walletAmounts: additionalInternalMetadata,
          senderAmounts: additionalUserUsdMetadata,
          recipientAmounts: additionalUserEurMetadata,
        })
        expectEntryToEqual(findEntry(credits, creditorAccountUuid), btcAmount)
        expectEntryToEqual(findEntry(debits, debitorAccountUuid), usdAmount)
        expectEntryToEqual(
          findEntry(debits, staticAccountUuids.dealerBtcAccountUuid),
          btcAmount,
        )
        expect(
          credits.find((tx) => tx.accounts === staticAccountUuids.dealerBtcAccountUuid),
        ).toBeUndefined()
        expectEntryToEqual(
          findEntry(credits, staticAccountUuids.dealerUsdAccountUuid),
          usdAmount,
        )
        expect(
          debits.find((tx) => tx.accounts === staticAccountUuids.dealerUsdAccountUuid),
        ).toBeUndefined()
      })

      it("to usd", () => {
        const entry = createEntry()
        const builder = EntryBuilder({
          staticAccountUuids,
          entry,
          metadata,
          additionalInternalMetadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withBankFee(ZERO_BANK_FEE)
          .debitAccount({
            accountDescriptor: usdDebitorAccountDescriptor,
            additionalMetadata: additionalUserUsdMetadata,
          })
          .creditAccount({
            accountDescriptor: usdCreditorAccountDescriptor,
            additionalMetadata: additionalUserEurMetadata,
          })

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)

        expectJournalToBeBalanced(result)
        testEntryDisplayAmounts(entry, {
          walletAmounts: additionalInternalMetadata,
          senderAmounts: additionalUserUsdMetadata,
          recipientAmounts: additionalUserEurMetadata,
        })
        expectEntryToEqual(findEntry(credits, creditorAccountUuid), usdAmount)
        expectEntryToEqual(findEntry(debits, debitorAccountUuid), usdAmount)
      })
    })
  })

  describe("metadata", () => {
    describe("offchain", () => {
      const entry = createEntry()
      const builder = EntryBuilder({
        staticAccountUuids,
        entry,
        metadata,
        additionalInternalMetadata,
      })
      const result = builder
        .withTotalAmount(amount)
        .withBankFee(ZERO_BANK_FEE)
        .debitAccount({
          accountDescriptor: btcDebitorAccountDescriptor,
          additionalMetadata: {
            ...additionalUserUsdMetadata,
            more: "yes",
            muchMore: "muchMore",
          },
        })
        .creditOffChain()

      const debits = result.transactions.filter((t) => t.debit > 0)
      expectJournalToBeBalanced(result)
      testEntryDisplayAmounts(entry, {
        walletAmounts: additionalInternalMetadata,
        senderAmounts: additionalUserUsdMetadata,
        recipientAmounts: additionalUserEurMetadata,
      })

      const resultEntry = findEntry(debits, debitorAccountUuid)

      it("debitor can take additional metadata", () => {
        expect(resultEntry.currency).toEqual(WalletCurrency.Btc)
        expect(resultEntry.meta).toEqual(
          expect.objectContaining({
            some: "some",
            more: "yes",
            muchMore: "muchMore",
          }),
        )
      })

      it("debitor can take memos", () => {
        expect(resultEntry).toEqual(
          expect.objectContaining({
            memo: "memo",
            memoPayer: "memoPayer",
          }),
        )
      })
    })
    describe("onchain", () => {
      const entry = createEntry()
      const builder = EntryBuilder({
        staticAccountUuids,
        entry,
        metadata,
        additionalInternalMetadata,
      })
      const result = builder
        .withTotalAmount(amount)
        .withBankFee(ZERO_BANK_FEE)
        .debitAccount({
          accountDescriptor: btcDebitorAccountDescriptor,
          additionalMetadata: {
            ...additionalUserUsdMetadata,
            more: "yes",
            muchMore: "muchMore",
          },
        })
        .creditOnChain()

      const debits = result.transactions.filter((t) => t.debit > 0)
      expectJournalToBeBalanced(result)
      testEntryDisplayAmounts(entry, {
        walletAmounts: additionalInternalMetadata,
        senderAmounts: additionalUserUsdMetadata,
        recipientAmounts: additionalUserEurMetadata,
      })

      const resultEntry = findEntry(debits, debitorAccountUuid)

      it("debitor can take additional metadata", () => {
        expect(resultEntry.currency).toEqual(WalletCurrency.Btc)
        expect(resultEntry.meta).toEqual(
          expect.objectContaining({
            some: "some",
            more: "yes",
            muchMore: "muchMore",
          }),
        )
      })

      it("debitor can take memos", () => {
        expect(resultEntry).toEqual(
          expect.objectContaining({
            memo: "memo",
            memoPayer: "memoPayer",
          }),
        )
      })
    })
  })
})
