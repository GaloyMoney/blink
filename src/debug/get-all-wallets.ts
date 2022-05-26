import { WalletsRepository } from "@services/mongoose"
import { setupMongoConnection } from "@services/mongodb"

const getAllWallets = async (): Promise<Wallet[] | ApplicationError> => {
  const wallets = await WalletsRepository().findAll()
  if (wallets instanceof Error) return wallets
  return wallets
}

const main = async () => {
  const result = await getAllWallets()
  if (result instanceof Error) {
    console.error("Error:", result)
    return
  }
  console.log(result)
}

setupMongoConnection()
  .then(async (mongoose) => {
    await main()
    if (mongoose) await mongoose.connection.close()
  })
  .catch((err) => console.log(err))
