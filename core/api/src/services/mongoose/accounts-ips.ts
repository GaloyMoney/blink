import { parseRepositoryError } from "./utils"

import { AccountIps } from "@/services/mongoose/schema"

import {
  CouldNotFindAccountIpError,
  PersistError,
  RepositoryError,
} from "@/domain/errors"

type UpdateQuery = {
  $set: {
    lastConnection: Date
    metadata?: IPType
  }
}

export const AccountsIpsRepository = (): IAccountsIPsRepository => {
  const update = async (
    accountIp: AccountIP | AccountIPNew,
  ): Promise<true | RepositoryError> => {
    const updateQuery: UpdateQuery = {
      $set: {
        lastConnection: new Date(),
      },
    }

    if (accountIp.metadata) {
      updateQuery.$set.metadata = accountIp.metadata
    }

    try {
      const result = await AccountIps.updateOne(
        { accountId: accountIp.accountId, ip: accountIp.ip },
        updateQuery,
        { upsert: true },
      )

      if (result.upsertedCount !== 1 && result.modifiedCount !== 1) {
        return new PersistError("Couldn't update ip for accountIp")
      }

      return true
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const findByAccountIdAndIp = async ({
    accountId,
    ip,
  }: FindByAccountIdAndIpArgs): Promise<AccountIP | RepositoryError> => {
    try {
      const result = await AccountIps.findOne({
        accountId,
        ip,
      })
      if (!result) {
        return new CouldNotFindAccountIpError(accountId)
      }

      return accountIPFromRaw(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const findLastByAccountId = async (
    accountId: AccountId,
  ): Promise<AccountIP | RepositoryError> => {
    try {
      const result = await AccountIps.findOne({
        accountId,
      }).sort({ lastConnection: -1 })

      if (!result) {
        return new CouldNotFindAccountIpError(accountId)
      }

      return accountIPFromRaw(result)
    } catch (error) {
      return parseRepositoryError(error)
    }
  }

  return {
    update,
    findLastByAccountId,
    findByAccountIdAndIp,
  }
}

const accountIPFromRaw = (result: AccountIpsRecord): AccountIP => {
  return {
    accountId: result.accountId as AccountId,
    ip: result.ip as IpAddress,
    metadata: result.metadata as IPType,
  }
}
