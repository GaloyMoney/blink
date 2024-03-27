import OpenAI, { OpenAIError } from "openai"

import { env } from "@/config/env"
import { sleep } from "@/utils"
import { UnknownDomainError } from "@/domain/shared"
import { ChatAssistantError, UnknownChatAssistantError } from "@/domain/support/errors"

let openai: OpenAI

if (env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  })
}

export const Assistant = () => {
  const assistantId = env.OPENAI_ASSISTANT_ID
  if (!assistantId) {
    throw new Error("No assistant id found")
  }
  if (!openai) {
    throw new Error("No openai instance found")
  }

  const initialize = async (): Promise<SupportChatId | ChatAssistantError> => {
    try {
      const thread = await openai.beta.threads.create()
      const supportChatId = thread.id as SupportChatId

      return supportChatId
    } catch (err) {
      if (err instanceof OpenAIError) {
        return new UnknownChatAssistantError(err.message)
      }
      return new UnknownChatAssistantError("openai unknown beta.threads.create error")
    }
  }

  const addUserMessage = async ({
    message,
    supportChatId,
    level,
    countryCode,
    language,
  }: {
    message: string
    supportChatId: SupportChatId
    level: number
    countryCode: string
    language: string
  }): Promise<true | Error> => {
    try {
      await openai.beta.threads.messages.create(supportChatId, {
        role: "user",
        content: message,
      })
    } catch (err) {
      if (err instanceof OpenAIError) {
        return new UnknownChatAssistantError(err.message)
      }
      return new UnknownChatAssistantError("openai unknown beta.threads.messages error")
    }

    const additionalInstructions = `This user has a phone number from ${countryCode}, is at level ${level}, and is using the ${language} ISO language`

    let run: OpenAI.Beta.Threads.Runs.Run

    try {
      run = await openai.beta.threads.runs.create(supportChatId, {
        assistant_id: assistantId,
        additional_instructions: additionalInstructions,
      })
    } catch (err) {
      if (err instanceof OpenAIError) {
        return new UnknownChatAssistantError(err.message)
      }
      return new UnknownChatAssistantError(
        "openai unknown beta.threads.runs.create error",
      )
    }

    while (["queued", "in_progress", "cancelling"].includes(run.status)) {
      // TODO: max timer for this loop
      // console.log(run.status, "run.status")
      // add open telemetry here? or is it already present with the http requests?

      await sleep(1000)
      try {
        run = await openai.beta.threads.runs.retrieve(run.thread_id, run.id)
      } catch (err) {
        if (err instanceof OpenAIError) {
          return new UnknownChatAssistantError(err.message)
        }
        return new UnknownChatAssistantError(
          "openai unknown beta.threads.runs.retrieve error",
        )
      }
    }

    if (run.status === "completed") {
      let messages: OpenAI.Beta.Threads.Messages.MessagesPage

      try {
        messages = await openai.beta.threads.messages.list(run.thread_id)
      } catch (err) {
        if (err instanceof OpenAIError) {
          return new UnknownChatAssistantError(err.message)
        }
        return new UnknownChatAssistantError(
          "openai unknown beta.threads.messages.list error",
        )
      }

      const responseThread = messages.data[0]

      if (responseThread.content[0]?.type !== "text") {
        console.log("last message is not text")
        return new UnknownChatAssistantError("last message is not text")
      }

      return true
    } else {
      console.log(run.status, "issue running the assistant")
      return new UnknownChatAssistantError("issue running the assistant")
    }
  }

  const getMessages = async (
    supportChatId: SupportChatId,
  ): Promise<Message[] | Error> => {
    try {
      const messages = await openai.beta.threads.messages.list(supportChatId)

      const processedResponse = messages.data
        .map((item) => ({
          id: item.id,
          role: item.role,
          message:
            item.content[0]?.type !== "text"
              ? "message is not a text" // TODO: proper error handling
              : item.content[0].text.value,
          timestamp: item.created_at,
        }))
        .reverse()

      return processedResponse
    } catch (err) {
      if (err instanceof OpenAIError) {
        return err
      }
      return new UnknownDomainError("openai unknown error")
    }
  }

  return { initialize, addUserMessage, getMessages }
}
