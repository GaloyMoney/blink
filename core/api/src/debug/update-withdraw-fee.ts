/**
 * how to run:
 *
 * Make sure there's a file named fee-update-operations.json in src/debug
 * following the structure:
 * {
 *  "feeUpdateOperations" = [
 *    { "walletId": "first-wallet-id", fee: 13 },
 *    { "walletId": "second-wallet-id", fee: 10 },
 *  ]
 * }
 * . ./.envrc && yarn ts-node --files -r tsconfig-paths/register src/debug/update-withdraw-fee.ts
 */

import mongoose from "mongoose"

import { feeUpdateOperations } from "./fee-update-operations.json"

import { updateAccountWithdrawFee } from "@/app/accounts/update-account-withdraw-fee"
import { setupMongoConnection } from "@/services/mongodb"
import { WalletsRepository } from "@/services/mongoose"
import { checkedToWalletId } from "@/domain/wallets"

type feeUpdateOperation = {
  walletId: string
  fee: number
}

const updateFee = async (operations: Array<feeUpdateOperation>) => {
  await setupMongoConnection()
  console.log("Mongoose connection ready")
  const walletRepo = WalletsRepository()
  for (const { walletId, fee } of operations) {
    const checkedWalletid = checkedToWalletId(walletId)

    if (checkedWalletid instanceof Error) {
      console.error(`Invalid walletId: ${walletId}`)
      continue
    }

    const wallet = await walletRepo.findById(checkedWalletid)
    if (wallet instanceof Error) {
      console.error(`Could not fetch wallet for walletId: ${walletId}`, { wallet })
      continue
    }

    const { accountId } = wallet

    const updateResult = await updateAccountWithdrawFee({ accountId, fee })
    if (updateResult instanceof Error) {
      console.error(`Could not set fee for walletId: ${walletId}`, { updateResult })
      continue
    }
    console.log(`Fee for walletId: ${walletId} set to ${fee}`)
  }
  return mongoose.connection.close()
}

updateFee(feeUpdateOperations).then(console.log).catch(console.error)
