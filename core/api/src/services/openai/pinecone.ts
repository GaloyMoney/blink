import axios from "axios"

import { env } from "@/config/env"
import { UnknownPineconeError } from "@/domain/support/errors"

interface Match {
  metadata?: {
    _node_content?: string
  }
}

export const retrieveRelatedQueries = async (
  vector: number[],
): Promise<string[] | Error> => {
  const topK = 8 // how many results to retrieve

  try {
    // TODO: fetch programmatically the endpoint. doc is not clear.
    const url = `https://blink-3072-5c8b1i4.svc.aped-4627-b74a.pinecone.io/query`
    const headers = {
      "Api-Key": env.PINECONE_API_KEY ?? "unknown",
      "Content-Type": "application/json",
    }

    const data = {
      vector,
      topK,
      includeMetadata: true,
    }

    const response = await axios.post(url, data, { headers })

    const results = response.data.matches.map(
      (match: Match) => JSON.parse(match.metadata?._node_content ?? "{}").text,
    )
    return results as string[]
  } catch (error) {
    console.error(error)
    return new UnknownPineconeError(error)
  }
}
