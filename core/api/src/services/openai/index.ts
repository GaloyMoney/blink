import OpenAI, { OpenAIError } from "openai"

import { env } from "@/config/env"
import { sleep } from "@/utils"
import { UnknownDomainError } from "@/domain/shared"

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

  const getMessages = async (threadId: ThreadId): Promise<Message[] | Error> => {
    try {
      const messages = await openai.beta.threads.messages.list(threadId)

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

  const initialize = async () => {
    try {
      const thread = await openai.beta.threads.create()
      const threadId = thread.id as ThreadId

      return threadId
    } catch (err) {
      if (err instanceof OpenAIError) {
        return err
      }
      return new UnknownDomainError("openai unknown error")
    }
  }

  const addUserMessage = async ({
    message,
    threadId,
    level,
    countryCode,
    language,
  }: {
    message: string
    threadId: ThreadId
    level: number
    countryCode: string
    language: string
  }): Promise<true | Error> => {
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    })

    const additionalInstructions = `This user has a phone number from ${countryCode}, is at level ${level}, and is using the ${language} ISO language`

    let run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      additional_instructions: additionalInstructions,
    })

    while (["queued", "in_progress", "cancelling"].includes(run.status)) {
      // TODO: max timer for this loop
      console.log(run.status, "run.status")

      await sleep(1000)
      run = await openai.beta.threads.runs.retrieve(run.thread_id, run.id)
    }

    if (run.status === "completed") {
      const messages = await openai.beta.threads.messages.list(run.thread_id)

      const responseThread = messages.data[0]

      if (responseThread.content[0]?.type !== "text") {
        console.log("last message is not text")
        return new Error("last message is not text")
      }

      return true
    } else {
      console.log(run.status, "issue running the assistant")
      return new Error("issue running the assistant")
    }
  }

  return { getMessages, addUserMessage, initialize }
}
