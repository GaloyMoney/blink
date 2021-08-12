import { WalletFactory } from "./wallet-factory"
import { GetTransactionsForWallet } from "./wallet/get-transactions-for-wallet"

// TODO: move and redo this with errors pattern
// TEMP workaround here
const GetWalletsForUser = async ({ user, logger }) => {
  const wallet = await WalletFactory({ user, logger })

  wallet.id = user.id // TODO: figure this out differently

  wallet.transactions = await GetTransactionsForWallet({ walletId: wallet.id })

  return [wallet]
}

const GetDefaultAccountForUser = async ({
  user,
  logger,
}: {
  user: UserType
  logger: Logger
}): Promise<Account | Error> => {
  const wallets = await GetWalletsForUser({ user, logger })

  const { level, language, status } = user

  return Promise.resolve({
    level,
    language,
    status,
    wallets,
  })
}

export default GetDefaultAccountForUser
