import { caseInsensitiveRegex, parseRepositoryError } from "./utils"

import { AccountStatus } from "@/domain/accounts"
import {
  CouldNotFindAccountFromKratosIdError,
  CouldNotFindAccountFromUsernameError,
  CouldNotFindAccountFromIdError,
  RepositoryError,
} from "@/domain/errors"
import { UsdDisplayCurrency } from "@/domain/fiat"

import { Account } from "@/services/mongoose/schema"

export const AccountsRepository = (): IAccountsRepository => {
  const listAccountsByStatus = (accountStatus: AccountStatus) =>
    async function* (): AsyncGenerator<Account> | RepositoryError {
      let accounts
      try {
        accounts = Account.find({
          $expr: { $eq: [{ $last: "$statusHistory.status" }, accountStatus] },
        })
      } catch (err) {
        return parseRepositoryError(err)
      }

      for await (const account of accounts) {
        yield translateToAccount(account)
      }
    }

  const findById = async (accountId: AccountId): Promise<Account | RepositoryError> => {
    try {
      const result = await Account.findOne({
        id: accountId,
      })
      if (!result) return new CouldNotFindAccountFromIdError(accountId)
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

  const update = async ({
    id,
    level,
    statusHistory,
    contactEnabled,
    contacts,
    username,
    defaultWalletId,
    withdrawFee,
    kratosUserId,
    displayCurrency,
    role,
  }: Account): Promise<Account | RepositoryError> => {
    try {
      const result = await Account.findOneAndUpdate(
        { id },
        {
          level,
          statusHistory,
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
          displayCurrency,
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

  const persistNew = async (kratosUserId: UserId): Promise<Account | RepositoryError> => {
    try {
      const account = new Account()
      account.kratosUserId = kratosUserId
      await account.save()
      return translateToAccount(account)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const findByUserId = async (
    kratosUserId: UserId,
  ): Promise<Account | RepositoryError> => {
    try {
      const result = await Account.findOne({ kratosUserId: { $eq: kratosUserId } })

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
    findByUserId,
    listUnlockedAccounts: listAccountsByStatus(AccountStatus.Active),
    listLockedAccounts: listAccountsByStatus(AccountStatus.Locked),
    findById,
    findByUsername,
    update,
  }
}

const translateToAccount = (result: AccountRecord): Account => ({
  id: result.id as AccountId,
  createdAt: new Date(result.created_at),
  defaultWalletId: result.defaultWalletId as WalletId,
  username: result.username as Username,
  level: result.level as AccountLevel,
  status: result.statusHistory.slice(-1)[0].status,
  statusHistory: (result.statusHistory || []) as AccountStatusHistory,
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
  withdrawFee: result.withdrawFee as Satoshis,

  kratosUserId: result.kratosUserId as UserId,
  displayCurrency: (result.displayCurrency || UsdDisplayCurrency) as DisplayCurrency,
})
