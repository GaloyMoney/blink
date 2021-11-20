import { yamlConfig } from "@config/app"
import { WalletFactory } from "@core/wallet-factory"
import { CouldNotFindUserFromPhoneError } from "@domain/errors"
import { baseLogger } from "@services/logger"
import { UsersRepository } from "@services/mongoose"
import { User } from "@services/mongoose/schema"

export const getAndCreateUserWallet = async (index: number) => {
  const entry = yamlConfig.test_accounts[index]
  const phone = entry.phone as PhoneNumber

  const users = UsersRepository()
  let userRepo = await users.findByPhone(phone)
  if (userRepo instanceof CouldNotFindUserFromPhoneError) {
    userRepo = await users.persistNew({ phone })
  }

  if (userRepo instanceof Error) throw userRepo
  const uid = userRepo.id

  if (entry.username) {
    await User.findOneAndUpdate({ _id: uid }, { username: entry.username })
  }

  if (entry.currencies) {
    await User.findOneAndUpdate({ _id: uid }, { currencies: entry.currencies })
  }

  if (entry.role) {
    await User.findOneAndUpdate({ _id: uid }, { role: entry.role })
  }

  if (entry.title) {
    await User.findOneAndUpdate({ _id: uid }, { title: entry.title })
  }

  const user = await User.findOne({ _id: uid })
  const userWallet = await WalletFactory({ user, logger: baseLogger })
  return userWallet
}
