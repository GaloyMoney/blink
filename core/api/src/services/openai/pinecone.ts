import { Pinecone } from "@pinecone-database/pinecone"

import { env } from "@/config/env"
import { UnknownPineconeError } from "@/domain/support/errors"

const pinecone = new Pinecone({
  apiKey: env.PINECONE_API_KEY ?? "unknown",
})

const index = "blink-3072"
const vectorStore = pinecone.index(index)

export const retrieveRelatedQueries = async (
  vector: number[],
): Promise<string[] | Error> => {
  const topK = 8 // how many results to retrieve

  try {
    const indexes = await vectorStore.query({
      vector,
      topK,
      includeMetadata: true,
    })
    const res = indexes.matches.map(
      (match) => JSON.parse(match.metadata?._node_content.toString() ?? "{}").text,
    )
    return res as string[]
  } catch (error) {
    return new UnknownPineconeError(error)
  }
}
