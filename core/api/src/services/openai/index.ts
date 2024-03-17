import OpenAI from "openai"

import { env } from "@/config/env"
import { RepositoryError } from "@/domain/errors"

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
})

export const Assistant = () => {
  const assistantId = env.OPENAI_ASSISTANT_ID
  if (!assistantId) {
    throw new Error("No assistant id found")
  }

  const getMessages = async (threadId: ThreadId) => {
    if (!threadId) {
      return []
    }

    const res = await openai.beta.threads.messages.list(threadId)
    res

    return res
  }

  const createThread = async () => {
    const thread = await openai.beta.threads.create()
    const threadId = thread.id as ThreadId

    return threadId
  }

  const addUserMessage = async ({
    message,
    threadId,
    additionalInstructions,
  }: {
    message: string
    threadId: ThreadId
    additionalInstructions?: string
  }) => {
    let thread: OpenAI.Beta.Threads.Thread

    const res2 = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    })

    const res = await openai.beta.threads.runs.create(threadId, {
      // TODO: should this be only injected on the first run?
      additional_instructions: additionalInstructions,
      assistant_id: assistantId,
    })

    // TODO: while loop
    thread = await openai.beta.threads.retrieve(threadId)
  }

  return { getMessages, addUserMessage, createThread }
}
