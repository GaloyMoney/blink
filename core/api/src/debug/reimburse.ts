/**
 * how to run:
 *
 * Make sure there's a file named reimbursements.json in src/debug
 * following the structure:
 * {
 *  "reimbursements" = [
 *    { "recipientWalletId": "first-wallet-id", "amount": 13, "memo": "memo1" },
 *    { "recipientWalletId": "second-wallet-id", "amount": 10, "memo": "memo2" },
 *  ]
 * }
 * . ./.envrc && yarn ts-node --files -r tsconfig-paths/register src/debug/reimburse.ts
 */

import { reimbursements } from "./reimbursements.json"

import { Payments } from "@/app"
import { checkedToSats } from "@/domain/bitcoin"
import { WalletCurrency } from "@/domain/shared"
import { checkedToWalletId } from "@/domain/wallets"
import { getBankOwnerWalletId } from "@/services/ledger/caching"
import { setupMongoConnection } from "@/services/mongodb"
import { AccountsRepository, WalletsRepository } from "@/services/mongoose"

type reimbursement = {
  recipientWalletId: string
  amount: number
  memo: string
}

const reimburse = async (reimbursements: Array<reimbursement>) => {
  await setupMongoConnection()
  console.log("Mongoose connection ready")
  const bankOwnerWalletId = await getBankOwnerWalletId()
  const bankOwnerWallet = await WalletsRepository().findById(bankOwnerWalletId)
  if (bankOwnerWallet instanceof Error) throw bankOwnerWallet
  const bankOwnerAccount = await AccountsRepository().findById(bankOwnerWallet.accountId)
  if (bankOwnerAccount instanceof Error) throw bankOwnerAccount

  for (const reimbursement of reimbursements) {
    const recipientWalletId = checkedToWalletId(reimbursement.recipientWalletId)
    if (recipientWalletId instanceof Error) {
      console.error(`Invalid walletId: ${recipientWalletId}`)
      continue
    }

    const amount = checkedToSats(reimbursement.amount)

    if (amount instanceof Error) {
      console.error(`Invalid amount: ${amount}`)
      continue
    }

    const intraledgerPaymentSendFn =
      bankOwnerWallet.currency === WalletCurrency.Btc
        ? Payments.intraledgerPaymentSendWalletIdForBtcWallet
        : Payments.intraledgerPaymentSendWalletIdForUsdWallet

    const reimburseResult = await intraledgerPaymentSendFn({
      recipientWalletId,
      amount,
      senderWalletId: bankOwnerWalletId,
      senderAccount: bankOwnerAccount,
      memo: reimbursement.memo,
    })
    console.log({ ...reimbursement, reimbursementStatus: reimburseResult })
  }
}

reimburse(reimbursements).then(console.log).catch(console.error)
