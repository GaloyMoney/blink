/**
 * how to run:
 * . ./.envrc && yarn ts-node --files -r tsconfig-paths/register src/debug/update-on-chain-receipt.ts
 */

import { intraledgerPaymentSendWalletId } from "@app/wallets"
import { getBankOwnerWalletId } from "@services/ledger/accounts"
import { baseLogger } from "@services/logger"
import { setupMongoConnection } from "@services/mongodb"

type reimbursement = {
  recipientWalletId: WalletId
  amount: Satoshis
  memo: string
}

const reimburse = async (reimbursements: Array<reimbursement>) => {
  await setupMongoConnection()
  console.log("Mongoose connection ready")
  const bankOwnerWalletId = await getBankOwnerWalletId()

  for (const reimbursement of reimbursements) {
    const reimburseResult = await intraledgerPaymentSendWalletId({
      recipientWalletId: reimbursement.recipientWalletId,
      amount: reimbursement.amount,
      logger: baseLogger,
      senderWalletId: bankOwnerWalletId,
      memo: reimbursement.memo,
    })
    console.log({ ...reimbursement, reimbursementStatus: reimburseResult })
  }
}

// Populate the array below with the recipient wallet public ids, sats and memo to be shown in the reimbursement txn

const reimbursements: Array<reimbursement> = [
  {
    recipientWalletId: "" as WalletId,
    amount: 0 as Satoshis,
    memo: "",
  },
]

// For example:
// const reimbursements = [
//   {
//     recipientWalletId: "d7d03fea-7e8f-4d38-8f4f-169ae455341b" as WalletId,
//     amount: 10 as Satoshis,
//     memo: "test",
//   },
//   {
//     recipientWalletId: "d7d03fea-7e8f-4d38-8f4f-169ae455341b" as WalletId,
//     amount: 11 as Satoshis,
//     memo: "test1",
//   },
// ]

reimburse(reimbursements).then(console.log).catch(console.error)
