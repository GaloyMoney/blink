import { onboardingEarn } from "@config"
import { AccountLevel, AccountStatus } from "@domain/accounts"
import { toSats } from "@domain/bitcoin"
import {
  CouldNotFindAccountFromKratosIdError,
  CouldNotFindAccountFromUsernameError,
  CouldNotFindError,
  RepositoryError,
} from "@domain/errors"

import { Account } from "@services/mongoose/schema"

import { fromObjectId, parseRepositoryError, toObjectId } from "./utils"

const caseInsensitiveRegex = (input: string) => {
  return new RegExp(`^${input}$`, "i")
}

export const AccountsRepository = (): IAccountsRepository => {
  const list = async (): Promise<Account[] | RepositoryError> => {
    try {
      const result = await Account.find({})
      return result.map((a) => translateToAccount(a))
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const listUnlockedAccounts = async (): Promise<Account[] | RepositoryError> => {
    try {
      const result = await Account.find({
        $expr: { $eq: [{ $last: "$statusHistory.status" }, AccountStatus.Active] },
      })
      if (result.length === 0) return new CouldNotFindError()
      return result.map((a) => translateToAccount(a))
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const findById = async (accountId: AccountId): Promise<Account | RepositoryError> => {
    try {
      const result = await Account.findOne({
        _id: toObjectId<AccountId>(accountId),
      })
      if (!result) return new CouldNotFindError()
      return translateToAccount(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const findByUsername = async (
    username: Username,
  ): Promise<Account | RepositoryError> => {
    try {
      const result = await Account.findOne({ username: caseInsensitiveRegex(username) })
      if (!result) {
        return new CouldNotFindAccountFromUsernameError(username)
      }
      return translateToAccount(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  // FIXME: could be in a different file? does not return an Account
  const listBusinessesForMap = async (): Promise<
    BusinessMapMarker[] | RepositoryError
  > => {
    try {
      const accounts = await Account.find(
        {
          title: { $exists: true, $ne: undefined },
          coordinates: { $exists: true, $ne: undefined },
        },
        { username: 1, title: 1, coordinates: 1 },
      )

      if (!accounts) {
        return new CouldNotFindError()
      }

      return accounts.map((account) => ({
        username: account.username as Username,
        mapInfo: {
          title: account.title as BusinessMapTitle,
          coordinates: account.coordinates as Coordinates,
        },
      }))
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const update = async ({
    id,
    level,
    statusHistory,
    coordinates,
    contactEnabled,
    contacts,
    title,
    username,
    defaultWalletId,
    withdrawFee,
    kratosUserId,

    role,
  }: Account): Promise<Account | RepositoryError> => {
    try {
      const result = await Account.findOneAndUpdate(
        { _id: toObjectId<AccountId>(id) },
        {
          level,
          statusHistory,
          coordinates,
          title,
          username,
          contactEnabled,
          contacts: contacts.map(
            ({ username, alias, transactionsCount }: AccountContact) => ({
              id: username,
              name: alias,
              transactionsCount,
            }),
          ),
          defaultWalletId,
          withdrawFee,
          kratosUserId,

          role,
        },
        {
          new: true,
        },
      )
      if (!result) {
        return new RepositoryError("Couldn't update account")
      }
      return translateToAccount(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const persistNew = async (
    kratosUserId: KratosUserId,
  ): Promise<Account | RepositoryError> => {
    try {
      const account = new Account()
      account.kratosUserId = kratosUserId
      await account.save()
      return translateToAccount(account)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const findByKratosUserId = async (
    kratosUserId: KratosUserId,
  ): Promise<Account | RepositoryError> => {
    try {
      const result = await Account.findOne({ kratosUserId })

      if (!result) {
        return new CouldNotFindAccountFromKratosIdError(kratosUserId)
      }

      return translateToAccount(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  return {
    persistNew,
    findByKratosUserId,
    listUnlockedAccounts,
    findById,
    findByUsername,
    list,
    listBusinessesForMap,
    update,
  }
}

const translateToAccount = (result: AccountRecord): Account => ({
  id: fromObjectId<AccountId>(result._id),
  createdAt: new Date(result.created_at),
  defaultWalletId: result.defaultWalletId as WalletId,
  username: result.username as Username,
  level: (result.level as AccountLevel) || AccountLevel.One,
  status: result.statusHistory.slice(-1)[0].status,
  statusHistory: (result.statusHistory || []) as AccountStatusHistory,
  title: result.title as BusinessMapTitle,
  coordinates: result.coordinates as Coordinates,
  contactEnabled: !!result.contactEnabled,
  contacts: result.contacts.reduce(
    (res: AccountContact[], contact: ContactObjectForUser): AccountContact[] => {
      if (contact.id) {
        res.push({
          id: contact.id as Username,
          username: contact.id as Username,
          alias: (contact.name || contact.id) as ContactAlias,
          transactionsCount: contact.transactionsCount,
        })
      }
      return res
    },
    [],
  ),
  depositFeeRatio: result.depositFeeRatio as DepositFeeRatio,
  withdrawFee: result.withdrawFee as Satoshis,
  isEditor: result.role === "editor",
  quizQuestions:
    result.earn?.map(
      (questionId: string): UserQuizQuestion => ({
        question: {
          id: questionId as QuizQuestionId,
          earnAmount: toSats(onboardingEarn[questionId]),
        },
        completed: true,
      }),
    ) || [],
  kratosUserId: result.kratosUserId as KratosUserId,
})
