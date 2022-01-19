/**
 * how to run:
 * . ./.envrc && yarn ts-node --files -r tsconfig-paths/register src/debug/update-fee.ts
 */

import { updateAccountWithdrawFee } from "@app/accounts/update-account-withdraw-fee"
import { RepositoryError } from "@domain/errors"
import { setupMongoConnection } from "@services/mongodb"
import { WalletsRepository } from "@services/mongoose"
import mongoose from "mongoose"

type feeUpdateOperation = {
  walletId: WalletId
  fee: Satoshis
}

const updateFee = async (operations: Array<feeUpdateOperation>) => {
  await setupMongoConnection()
  console.log("Mongoose connection ready")
  const walletRepo = WalletsRepository()
  for (const { walletId, fee } of operations) {
    const wallet = await walletRepo.findById(walletId)
    if (wallet instanceof RepositoryError) {
      console.error(`Could not fetch wallet for walletId: ${walletId}`, { wallet })
      break
    }

    const { accountId: id } = wallet

    const updateResult = await updateAccountWithdrawFee({ id, fee })
    if (updateResult instanceof Error) {
      console.error(`Could not set fee for walletId: ${walletId}`, { updateResult })
      break
    }
    console.log(`Fee for walletId: ${walletId} set to ${fee}`)
  }
  return mongoose.connection.close()
}

// Populate the array below with the wallet ids and fees to be set

const feeUpdateOperations: Array<feeUpdateOperation> = [
  { walletId: "" as WalletId, fee: 0 as Satoshis },
]

// For example:
// feeUpdateOperations = [
//   { walletId: "70767cc2-9cab-4bab-b78a-5e6b2d947163" as WalletId, fee: 13 as Satoshis },
//   { walletId: "70767cc2-9cab-4bab-b78a-5e6b2d947163" as WalletId, fee: -1 as Satoshis },
// ]

updateFee(feeUpdateOperations).then(console.log).catch(console.error)
