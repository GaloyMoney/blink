import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client"
import { propagation, context } from "@opentelemetry/api"
import { env } from "@/env"
import { headers } from "next/headers"
import { addAttributesToCurrentSpan } from "@/app/tracing"

export const apolloClient = {
  UnAuthed: () => {
    const headersList = headers()
    const ipHeaders: { [key: string]: string } = {}

    const realIP = headersList.get("x-real-ip")
    const forwardedFor = headersList.get("x-forwarded-for")

    if (realIP) {
      ipHeaders["x-real-ip"] = realIP
    }

    if (forwardedFor) {
      ipHeaders["x-forwarded-for"] = forwardedFor
    }

    addAttributesToCurrentSpan({
      ["x-real-ip"]: String(headersList.get("x-real-ip")),
      ["x-forwarded-for"]: String(headersList.get("x-forwarded-for")),
    })

    return new ApolloClient({
      cache: new InMemoryCache(),
      link: new HttpLink({
        uri: env.CORE_URL,
        fetchOptions: { cache: "no-store" },
        headers: {
          ...ipHeaders,
        },
        fetch: (uri, options) => {
          const headersWithTrace = options?.headers || {}
          propagation.inject(context.active(), headersWithTrace)
          return fetch(uri, {
            ...options,
            headers: headersWithTrace,
          })
        },
      }),
    })
  },
}
