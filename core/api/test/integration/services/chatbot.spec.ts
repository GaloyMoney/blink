import { baseLogger } from "@/services/logger"
import { Assistant, textToVector } from "@/services/openai"
import { retrieveRelatedQueries } from "@/services/pinecone"

describe("Embeddings", () => {
  it("get a vector back", async () => {
    if (!process.env.OPENAI_API_KEY) {
      baseLogger.info("No OpenAI API key found, skipping test")
      return
    }

    const vector = await textToVector("Hello, world!")
    if (vector instanceof Error) throw vector
    expect(vector.length).toBe(3072)
  })
})

describe("Pinecone", () => {
  it("get a vector back", async () => {
    if (!process.env.OPENAI_API_KEY || !process.env.PINECONE_API_KEY) {
      baseLogger.info("No OpenAI API or Pinecone API key found, skipping test")
      return
    }

    const vector = await textToVector("How do I add a business to the map?")
    if (vector instanceof Error) throw vector

    const results = await retrieveRelatedQueries(vector)
    if (results instanceof Error) throw results

    expect(results[0]).toEqual(`- User: How can I add my business to the map?
- Assistant: You can add your business to the map on the following link: map.blink.sv`)
  })
})

describe("ChatSupport", () => {
  it("manages actions", async () => {
    if (!process.env.OPENAI_API_KEY) {
      baseLogger.info("No OpenAI API key found, skipping test")
      return
    }

    const level = 1
    const countryCode = "SV"
    const language = "en"

    const supportChatId = await Assistant().initialize({ level, countryCode, language })
    if (supportChatId instanceof Error) throw supportChatId

    const res = await Assistant().addUserMessage({
      message: "I can't receive a transactions",
      supportChatId,
    })

    expect(res).toBeTruthy()
  }, 60000)
})
