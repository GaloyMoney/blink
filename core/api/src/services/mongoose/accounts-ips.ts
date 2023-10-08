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
        { accountUuid: accountIp.accountUuid, ip: accountIp.ip },
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

  const findByAccountUuidAndIp = async ({
    accountUuid,
    ip,
  }: FindByAccountUuidAndIpArgs): Promise<AccountIP | RepositoryError> => {
    try {
      const result = await AccountIps.findOne({
        accountUuid,
        ip,
      })
      if (!result) {
        return new CouldNotFindAccountIpError(accountUuid)
      }

      return accountIPFromRaw(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const findLastByAccountUuid = async (
    accountUuid: AccountUuid,
  ): Promise<AccountIP | RepositoryError> => {
    try {
      const result = await AccountIps.findOne({
        accountUuid,
      }).sort({ lastConnection: -1 })

      if (!result) {
        return new CouldNotFindAccountIpError(accountUuid)
      }

      return accountIPFromRaw(result)
    } catch (error) {
      return parseRepositoryError(error)
    }
  }

  return {
    update,
    findLastByAccountUuid,
    findByAccountUuidAndIp,
  }
}

const accountIPFromRaw = (result: AccountIpsRecord): AccountIP => {
  return {
    accountUuid: result.accountUuid as AccountUuid,
    ip: result.ip as IpAddress,
    metadata: result.metadata as IPType,
  }
}
