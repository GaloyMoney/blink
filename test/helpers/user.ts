import * as jwt from "jsonwebtoken"
import { yamlConfig } from "src/config"
import { baseLogger } from "src/logger"
import { User } from "src/schema"
import { login } from "src/text"
import { WalletFactory } from "src/walletFactory"

export const getTokenFromPhoneIndex = async (index) => {
  const entry = yamlConfig.test_accounts[index]
  const raw_token = await login({ ...entry, logger: baseLogger, ip: "127.0.0.1" })
  const token = jwt.verify(raw_token, process.env.JWT_SECRET)

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
