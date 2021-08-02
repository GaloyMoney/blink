import { login } from "@core/text"
import { User } from "@services/mongoose/schema"
import * as jwt from "jsonwebtoken"
import { baseLogger } from "@services/logger"
import { yamlConfig } from "@config/app"
import { WalletFactory } from "@core/wallet-factory"

export const getTokenFromPhoneIndex = async (index) => {
  const entry = yamlConfig.test_accounts[index]
  const rawToken = await login({ ...entry, logger: baseLogger, ip: "127.0.0.1" })
  const token = jwt.verify(rawToken, process.env.JWT_SECRET)

  const { uid } = token

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

  return token
}

export const getUserWallet = async (userNumber) => {
  const token = await getTokenFromPhoneIndex(userNumber)
  const user = await User.findOne({ _id: token.uid })
  const userWallet = await WalletFactory({ user, logger: baseLogger })
  return userWallet
}
