import { Assistant } from "@/services/openai"

// this test needs an OpenAI API key to run
// not running this test in CI
describe("conversation", () => {
  it("add 2 message to the thread", async () => {
    if (!process.env.OPENAI_API_KEY) {
      console.log("No OpenAI API key found, skipping test")
      return
    }

    const threadId = await Assistant().initialize()
    if (threadId instanceof Error) throw threadId

    const level = 1
    const countryCode = "SV"
    const language = "en"

    await Assistant().addUserMessage({
      message: "I can't receive a transactions",
      threadId,
      level,
      countryCode,
      language,
    })

    await Assistant().addUserMessage({
      message: "How can I send sats onchain?",
      threadId,
      level,
      countryCode,
      language,
    })

    const messages = await Assistant().getMessages(threadId)

    expect(messages).toEqual([
      {
        role: "user",
        message: "I can't receive a transactions",
        id: expect.any(String),
        timestamp: expect.any(Number),
      },
      {
        role: "assistant",
        message: expect.any(String),
        id: expect.any(String),
        timestamp: expect.any(Number),
      },
      {
        role: "user",
        message: "How can I send sats onchain?",
        id: expect.any(String),
        timestamp: expect.any(Number),
      },
      {
        role: "assistant",
        message: expect.any(String),
        id: expect.any(String),
        timestamp: expect.any(Number),
      },
    ])
  }, 60000)
})
