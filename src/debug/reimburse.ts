/**
 * how to run:
 * . ./.envrc && yarn ts-node --files -r tsconfig-paths/register src/debug/update-on-chain-receipt.ts
 */

import { intraledgerPaymentSendWalletId } from "@app/wallets"
import { getBankOwnerWalletId } from "@services/ledger/accounts"
import { baseLogger, baseLogger as logger } from "@services/logger"
import { setupMongoConnection } from "@services/mongodb"
import { redis } from "@services/redis"

type recipient = {
  recipientWalletId: WalletId
  amount: Satoshis
}

const reimburse = async (recipients: Array<recipient>) => {
  const mongoose = await setupMongoConnection()
  const bankOwnerWalletId = await getBankOwnerWalletId()

  for (const recipient of recipients) {
    await intraledgerPaymentSendWalletId({
      recipientWalletId: recipient.recipientWalletId,
      amount: recipient.amount,
      logger: baseLogger,
      senderWalletId: bankOwnerWalletId,
      memo: "",
    })
  }

  await mongoose.connection.close()
  redis.disconnect()
}

// Populate the array below with the recipient wallet public ids, sats and memo to be shown in the reimbursement txn
const recipients = [
  {
    recipientWalletId: "" as WalletId,
    amount: 0 as Satoshis,
    memo: "",
  },
]

reimburse(recipients).then(console.log).catch(console.error)
