import { baseLogger } from "@/services/logger"
import { Assistant } from "@/services/openai"
describe("ChatSupport", () => {
  it("add 2 message to the thread", async () => {
    // this test needs an OpenAI API key to run
    // not running this test in CI
    if (!process.env.OPENAI_API_KEY) {
      baseLogger.info("No OpenAI API key found, skipping test")
      return
    }

    const supportChatId = await Assistant().initialize()
    if (supportChatId instanceof Error) throw supportChatId

    const level = 1
    const countryCode = "SV"
    const language = "en"

    await Assistant().addUserMessage({
      message: "I can't receive a transactions",
      supportChatId,
      level,
      countryCode,
      language,
    })

    await Assistant().addUserMessage({
      message: "How can I send sats onchain?",
      supportChatId,
      level,
      countryCode,
      language,
    })

    const messages = await Assistant().getMessages(supportChatId)

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
