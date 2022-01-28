/**
 * how to run:
 *
 * Make sure there's a file named reimbursements.json in src/debug
 * following the structure:
 * {
 *  "feeUpdateOperations" = [
 *    { "walletId": "first-wallet-id", fee: 13, memo: "your memo" },
 *    { "walletId": "second-wallet-id", fee: 10, memo: "refund" },
 *  ]
 * }
 * . ./.envrc && yarn ts-node --files -r tsconfig-paths/register src/debug/reimburse.ts
 */

import { intraledgerPaymentSendWalletId } from "@app/wallets"
import { checkedToSats } from "@domain/bitcoin"
import { checkedToWalletId } from "@domain/wallets"
import { getBankOwnerWalletId } from "@services/ledger/accounts"
import { baseLogger } from "@services/logger"
import { setupMongoConnection } from "@services/mongodb"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"

import { reimbursements } from "./reimbursements.json"

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

    const reimburseResult = await intraledgerPaymentSendWalletId({
      recipientWalletId,
      amount,
      logger: baseLogger,
      senderWalletId: bankOwnerWalletId,
      senderAccount: bankOwnerAccount,
      memo: reimbursement.memo,
    })
    console.log({ ...reimbursement, reimbursementStatus: reimburseResult })
  }
}

reimburse(reimbursements).then(console.log).catch(console.error)
