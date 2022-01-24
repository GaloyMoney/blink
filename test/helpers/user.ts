import { createUser } from "@app/users"
import { yamlConfig } from "@config"
import { CouldNotFindUserFromPhoneError } from "@domain/errors"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import { User } from "@services/mongoose/schema"
import { toObjectId } from "@services/mongoose/utils"

const users = UsersRepository()

export const getPhoneByTestUserIndex = (index: number) => {
  const entry = yamlConfig.test_accounts[index]
  const phone = entry.phone as PhoneNumber
  return phone
}

export const getUserByTestUserIndex = async (index: number) => {
  const phone = getPhoneByTestUserIndex(index)
  const user = await UsersRepository().findByPhone(phone)
  if (user instanceof Error) throw user
  return user
}

export const getAccountByTestUserIndex = async (index: number) => {
  const user = await getUserByTestUserIndex(index)
  const account = await AccountsRepository().findByUserId(user.id)
  if (account instanceof Error) throw account
  return account
}

export const getUserIdByTestUserIndex = async (index: number) => {
  const user = await getUserByTestUserIndex(index)
  return user.id
}

export const getAccountIdByTestUserIndex = async (index: number) => {
  const account = await getAccountByTestUserIndex(index)
  return account.id
}

export const getDefaultWalletIdByTestUserIndex = async (index: number) => {
  const account = await getAccountByTestUserIndex(index)
  return account.defaultWalletId
}

export const getDefaultWalletByTestUserIndex = async (index: number) => {
  const account = await getAccountByTestUserIndex(index)
  const user = await WalletsRepository().findById(account.defaultWalletId)
  if (user instanceof Error) throw user
  return user
}

export const getUserRecordByTestUserIndex = async (index: number) => {
  const entry = yamlConfig.test_accounts[index]
  const phone = entry.phone as PhoneNumber

  return User.findOne({ phone }) as UserRecord
}

export const createMandatoryUsers = async () => {
  const users = [
    4, // funder
    6, // dealer
    14, // bank owner
  ]
  for (const user of users) {
    await createUserWallet(user)
  }
}

export const createUserWallet = async (index: number) => {
  const entry = yamlConfig.test_accounts[index]
  const phone = entry.phone as PhoneNumber

  let userRepo = await users.findByPhone(phone)
  if (userRepo instanceof CouldNotFindUserFromPhoneError) {
    const phoneMetadata = entry.phoneMetadataCarrierType
      ? {
          carrier: {
            type: entry.phoneMetadataCarrierType,
            name: "",
            mobile_network_code: "",
            mobile_country_code: "",
            error_code: "",
          },
          countryCode: "US",
        }
      : null
    userRepo = await createUser({ phone, phoneMetadata })
  }

  if (userRepo instanceof Error) throw userRepo
  const uid = userRepo.id

  if (entry.username) {
    await User.findOneAndUpdate(
      { _id: toObjectId<UserId>(uid) },
      { username: entry.username },
    )
  }

  if (entry.role) {
    await User.findOneAndUpdate({ _id: toObjectId<UserId>(uid) }, { role: entry.role })
  }

  if (entry.title) {
    await User.findOneAndUpdate(
      { _id: toObjectId<UserId>(uid) },
      { title: entry.title, coordinates: { latitude: -1, longitude: 1 } },
    )
  }
}
