import { SupportChat } from "./schema"

import { UnknownRepositoryError, CouldNotFindError } from "@/domain/errors"

export const SupportChatRepository = (): ISupportChatRepository => {
  const create = async ({
    supportChatId,
    accountId,
  }: {
    supportChatId: SupportChatId
    accountId: AccountId
  }) => {
    try {
      await SupportChat.create({ accountId, supportChatId })
      return true
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const findNewestByAccountId = async (
    accountId: AccountId,
  ): Promise<SupportChatId | RepositoryError> => {
    try {
      const result = await SupportChat.findOne({ accountId }).sort({ createdAt: -1 })
      if (!result) {
        return new CouldNotFindError("No support chat found")
      }

      return result.supportChatId as SupportChatId
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const remove = async ({
    supportChatId,
    accountId,
  }: {
    supportChatId: SupportChatId
    accountId: AccountId
  }) => {
    try {
      await SupportChat.deleteOne({ supportChatId, accountId })
      return true
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    create,
    remove,
    findNewestByAccountId,
  }
}
