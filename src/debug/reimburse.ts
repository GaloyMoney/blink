/**
 * how to run:
 * . ./.envrc && yarn ts-node --files -r tsconfig-paths/register src/debug/update-on-chain-receipt.ts
 */

import { intraledgerPaymentSendWalletId } from "@app/wallets"
import { getBankOwnerWalletId } from "@services/ledger/accounts"
import { baseLogger } from "@services/logger"
import { setupMongoConnection } from "@services/mongodb"

type recipient = {
  recipientWalletId: WalletId
  amount: Satoshis
  memo: string
}

const reimburse = async (recipients: Array<recipient>) => {
  const mongoose = await setupMongoConnection()
  console.log("Mongoose connection ready")
  const bankOwnerWalletId = await getBankOwnerWalletId()

  for (const recipient of recipients) {
    console.log("attempting reimburse:", { recipient })
    const res = await intraledgerPaymentSendWalletId({
      recipientWalletId: recipient.recipientWalletId,
      amount: recipient.amount,
      logger: baseLogger,
      senderWalletId: bankOwnerWalletId,
      memo: recipient.memo,
    })
  }
}

// Populate the array below with the recipient wallet public ids, sats and memo to be shown in the reimbursement txn
const recipients = [
  {
    recipientWalletId: "" as WalletId,
    amount: 0 as Satoshis,
    memo: "refund",
  },
]

reimburse(recipients).then(console.log).catch(console.error)
