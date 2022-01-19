import { updateAccountWithdrawFee } from "@app/accounts/update-account-withdraw-fee"
import { RepositoryError } from "@domain/errors"
import { baseLogger } from "@services/logger"
import { WalletsRepository } from "@services/mongoose"
import { setupMongoConnection } from "@services/mongodb"
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

let feeUpdateOperations: Array<feeUpdateOperation>

feeUpdateOperations = [
  { walletId: "70767cc2-9cab-4bab-b78a-5e6b2d947163" as WalletId, fee: 13 as Satoshis },
  { walletId: "70767cc2-9cab-4bab-b78a-5e6b2d947163" as WalletId, fee: -1 as Satoshis },
]

updateFee(feeUpdateOperations).then(console.log).catch(console.error)
