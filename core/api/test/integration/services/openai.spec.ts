import { AccountsRepository } from "@/services/mongoose"
import { Assistant } from "@/services/openai"
import { randomUserId } from "test/helpers"

describe("conversation", () => {
  it("should return an empty array if the account is new", async () => {
    const threadId = randomUUID()
    expect(await Assistant().getMessages(threadId)).toEqual([])
  })

  it.skip("add a message to the thread", async () => {
    const threadId = randomUUID()
    await Assistant().addUserMessage({ message: "Hello, world!", threadId })
    const messages = await Assistant().getMessages(threadId)
    if (messages instanceof Error) throw messages
    if (!messages) throw new Error("No messages found")
    if (messages.length === 0) throw new Error("No messages found")

    expect(messages[0].content).toEqual("Hello, world!")
  })
})
