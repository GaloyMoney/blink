import { UnknownRepositoryError } from "@/domain/errors"
import { SupportChat } from "./schema"
import { ChatSupportNotFoundError } from "@/domain/chat-support/errors"

export const SupportChatRepository = () => {
  const add = async ({
    supportChatId,
    accountId,
  }: {
    supportChatId: string
    accountId: string
  }) => {
    try {
      await SupportChat.create({ accountId, supportChatId })
      return true
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const getLastFromAccountId = async (
    accountId: string,
  ): Promise<SupportChatId | ChatSupportNotFoundError> => {
    try {
      const result = await SupportChat.findOne({ accountId }).sort({ createdAt: -1 })
      if (!result) {
        return new ChatSupportNotFoundError("No support chat found")
      }

      return result.supportChatId as SupportChatId
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    add,
    getLastFromAccountId,
  }
}
