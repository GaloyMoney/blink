import { createClient } from "graphql-ws"
import WebSocket from "ws"

// % node --loader ts-node/esm src/debug/websocket.ts
// tsconfig: module: ESNext
// "type": "module",

const client = createClient({
  // url: "ws://localhost:4002/graphqlws",
  url: "ws://localhost:4002/graphql",
  webSocketImpl: WebSocket,
})

// subscription
const onNext = (value) => {
  console.log("onNext", value)
  /* handle incoming values */
}

let unsubscribe = () => {
  console.log("unsubscribe")
  /* complete the subscription */
}

try {
  await new Promise((resolve, reject) => {
    unsubscribe = client.subscribe(
      {
        query: `subscription lnInvoicePaymentStatusSubscription($input: LnInvoicePaymentStatusInput!) {
          lnInvoicePaymentStatus(input: $input) {
            errors {
              message
            }
            status
          }
        }`,
        variables: {
          input: {
            paymentRequest:
              "lnbcrt10u1pjfgnxspp5ggqdug7c33wntrhzsm5dwk6uw3x6rrs86jpmy8423kqac53d939qhp5p6zx5m5k4t3kx2fghufjppd0fskldzcz4d20hyeavgdsyl2vazqscqzzsxqyz5vqsp57eetrcedpz57pa7jf3l7tt3tky0uvdj34v37hm4mws68pfkuynxq9qyyssqcmxnswz3ztld5q6c8kt7hdh7ez0hx0v6qzzmcmyx5whvnfvvxj7h9z9k8gck564jx3hxgulg4757vnn4phz73s3xfwvxc7nkfennfkgqxqwg7a",
          },
        },
      },
      {
        next: onNext,
        error: reject,
        complete: () => resolve(undefined),
      },
    )
  })

  console.log("subscription completed")
  unsubscribe()
  //   expect(onNext).toHaveBeenCalledTimes(5) // we say "Hi" in 5 languages
} catch (err) {
  console.error(err)
}
