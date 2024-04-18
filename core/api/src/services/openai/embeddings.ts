import OpenAI, { OpenAIError } from "openai"

import { env } from "@/config/env"

let openai: OpenAI

if (env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  })
}

export async function textToVector(text: string): Promise<number[] | Error> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: text,
      encoding_format: "float",
    })
    return response.data[0].embedding
  } catch (error) {
    if (error instanceof OpenAIError) {
      return new Error(error.message)
    }
    return new Error("unknown openai embeddings error")
  }
}
