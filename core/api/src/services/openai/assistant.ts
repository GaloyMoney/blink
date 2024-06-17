import assert from "assert"

import OpenAI, { NotFoundError } from "openai"

import { textToVector } from "./embeddings"

import { retrieveRelatedQueries } from "./pinecone"

import { env } from "@/config/env"
import { sleep } from "@/utils"
import { UnknownDomainError } from "@/domain/shared"
import {
  ChatAssistantNotFoundError,
  TimeoutAssistantError,
  UnknownChatAssistantError,
} from "@/domain/support/errors"

const assistantId = env.OPENAI_ASSISTANT_ID ?? ""

let openai: OpenAI

if (env.OPENAI_API_KEY && assistantId) {
  openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  })
}
export const Assistant = (): ChatAssistant => {
  const initialize = async ({
    level,
    countryCode,
    language,
  }: {
    level: number
    countryCode: string
    language: string
  }): Promise<SupportChatId | ChatAssistantError> => {
    try {
      const thread = await openai.beta.threads.create()
      const supportChatId = thread.id as SupportChatId

      const message = `Hi. Here's some information about me. My language is ${language}, my account is at level ${level}, and my phone number is from ${countryCode}.`

      try {
        await openai.beta.threads.messages.create(supportChatId, {
          role: "user",
          content: message,
        })
      } catch (err) {
        return new UnknownChatAssistantError(err)
      }

      let run: OpenAI.Beta.Threads.Runs.Run

      try {
        run = await openai.beta.threads.runs.create(supportChatId, {
          assistant_id: assistantId,
        })
      } catch (err) {
        return new UnknownChatAssistantError(err)
      }

      const res = await waitForCompletion({ runId: run.id, threadId: run.thread_id })
      if (res instanceof Error) return res

      return supportChatId
    } catch (err) {
      return new UnknownChatAssistantError(err)
    }
  }

  const addUserMessage = async ({
    message,
    supportChatId,
  }: {
    message: string
    supportChatId: SupportChatId
  }): Promise<true | Error> => {
    try {
      let runsCompleted = false
      while (!runsCompleted) {
        runsCompleted = true
        const runs = await openai.beta.threads.runs.list(supportChatId)
        for (const run of runs.data) {
          switch (run.status) {
            case "in_progress":
            case "cancelling":
            case "requires_action":
            case "queued":
            case "incomplete":
              await openai.beta.threads.runs.cancel(supportChatId, run.id)
              runsCompleted = false
              break
            default:
              runsCompleted = true
              break
          }
        }
      }
    } catch (err) {
      return new UnknownChatAssistantError(err)
    }

    try {
      await openai.beta.threads.messages.create(supportChatId, {
        role: "user",
        content: message,
      })
    } catch (err) {
      return new UnknownChatAssistantError(err)
    }

    let run: OpenAI.Beta.Threads.Runs.Run

    try {
      run = await openai.beta.threads.runs.create(supportChatId, {
        assistant_id: assistantId,
      })
    } catch (err) {
      return new UnknownChatAssistantError(err)
    }

    return waitForCompletion({ runId: run.id, threadId: run.thread_id })
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
        .slice(1) // we are not sending back the context message from the user, that says the user's language, level, and phone country

      return processedResponse
    } catch (err) {
      if (err instanceof NotFoundError) return new ChatAssistantNotFoundError()

      return new UnknownDomainError(err)
    }
  }

  const processAction = async (run: OpenAI.Beta.Threads.Runs.Run): Promise<string[]> => {
    const action = run.required_action
    assert(action?.type === "submit_tool_outputs")

    const outputs: string[] = []

    for (const toolCall of action.submit_tool_outputs.tool_calls) {
      const name = toolCall.function.name
      assert(name === "queryBlinkKnowledgeBase")

      const args = toolCall.function.arguments
      const query = JSON.parse(args).query_str

      const vector = await textToVector(query)
      if (vector instanceof Error) throw vector

      const relatedQueries = await retrieveRelatedQueries(vector)
      if (relatedQueries instanceof Error) throw relatedQueries

      let output = ""
      let i = 0
      for (const query of relatedQueries) {
        output += `Context chunk ${i}:\n${query}\n-----\n`
        i += 1
      }

      outputs.push(output)
    }

    return outputs
  }

  const waitForCompletion = async ({
    runId,
    threadId,
  }: {
    runId: string
    threadId: string
  }): Promise<true | ChatAssistantError> => {
    let run: OpenAI.Beta.Threads.Runs.Run
    const maxRetries = 60 // Assuming a 30-second timeout with 500ms sleep
    let retries = 0

    try {
      run = await openai.beta.threads.runs.retrieve(threadId, runId)
    } catch (err) {
      return new UnknownChatAssistantError(err)
    }

    while (
      ["queued", "in_progress", "cancelling", "requires_action"].includes(run.status)
    ) {
      if (retries >= maxRetries) {
        return new TimeoutAssistantError()
      }

      // Add telemetry here if needed
      await sleep(500)
      retries += 1

      try {
        run = await openai.beta.threads.runs.retrieve(threadId, runId)
      } catch (err) {
        return new UnknownChatAssistantError(err)
      }

      if (run.status === "requires_action") {
        let outputs: string[]
        try {
          outputs = await processAction(run)
        } catch (err) {
          return new UnknownChatAssistantError(err)
        }

        try {
          await openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
            tool_outputs: outputs.map((output, index) => ({
              tool_call_id: run.required_action?.submit_tool_outputs.tool_calls[index].id,
              output,
            })),
          })
        } catch (err) {
          return new UnknownChatAssistantError(err)
        }
      }
    }

    if (run.status === "completed") {
      let messages: OpenAI.Beta.Threads.Messages.MessagesPage

      try {
        messages = await openai.beta.threads.messages.list(run.thread_id)
      } catch (err) {
        return new UnknownChatAssistantError(err)
      }

      const responseThread = messages.data[0]

      if (responseThread.content[0]?.type !== "text") {
        return new UnknownChatAssistantError("Last message is not text")
      }

      return true
    } else {
      return new UnknownChatAssistantError("Issue running the assistant")
    }
  }

  return { initialize, addUserMessage, getMessages }
}
