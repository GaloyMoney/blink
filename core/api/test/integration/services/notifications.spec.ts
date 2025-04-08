import { AccountLevel } from "@/domain/accounts"
import { displayCurrencyPerBaseUnitFromAmounts } from "@/domain/wallets/tx-history"
import { WalletCurrency } from "@/domain/shared"
import { toSats } from "@/domain/bitcoin"

import { NotificationsService } from "@/services/notifications"

import { createRandomUserAndBtcWallet, waitForNotificationsService } from "test/helpers"
import { AccountsRepository } from "@/services/mongoose"

beforeAll(async () => {
  await waitForNotificationsService()
})

describe("NotificationsService", () => {
  describe("sendTransaction", () => {
    it("should send a notification", async () => {
      // Create user
      const newWalletDescriptor = await createRandomUserAndBtcWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      const userId = newAccount.kratosUserId
      const walletId = newWalletDescriptor.id
      const accountId = newWalletDescriptor.accountId

      const paymentAmount = {
        amount: 1000n,
        currency: WalletCurrency.Btc,
        settlementAmount: toSats(-1000),
        settlementAmountSend: toSats(-1000),
        settlementFee: toSats(0),
        settlementDisplayFee: "0",
      }
      const crcDisplayPaymentAmount = {
        amountInMinor: 350050n,
        currency: "CRC" as DisplayCurrency,
        displayInMajor: "3500.50",
      }
      const crcSettlementDisplayPrice = <S extends WalletCurrency>({
        walletAmount,
        walletCurrency,
      }: {
        walletAmount: number
        walletCurrency: S
      }) =>
        displayCurrencyPerBaseUnitFromAmounts({
          displayCurrency: crcDisplayPaymentAmount.currency,
          displayAmount: Number(crcDisplayPaymentAmount.amountInMinor),
          walletAmount,
          walletCurrency,
        })

      const result = await NotificationsService().sendTransaction({
        recipient: {
          accountId,
          walletId,
          userId,
          level: AccountLevel.One,
        },
        transaction: {
          id: "id" as LedgerTransactionId,
          status: "success",
          memo: "",
          walletId,
          externalId: "externalId" as LedgerExternalId,
          initiationVia: {
            type: "onchain",
          },
          settlementVia: {
            type: "intraledger",
            counterPartyWalletId: "counterPartyWalletId" as WalletId,
            counterPartyUsername: "counterPartyUsername" as Username,
          },
          settlementAmount: paymentAmount.settlementAmount,
          settlementCurrency: paymentAmount.currency,
          settlementFee: paymentAmount.settlementFee,
          settlementDisplayAmount: crcDisplayPaymentAmount.displayInMajor,
          settlementDisplayPrice: crcSettlementDisplayPrice({
            walletAmount: toSats(paymentAmount.amount),
            walletCurrency: paymentAmount.currency,
          }),
          settlementDisplayFee: paymentAmount.settlementDisplayFee,
          createdAt: new Date(),
        },
      })
      expect(result).not.toBeInstanceOf(Error)
    })
  })
})
