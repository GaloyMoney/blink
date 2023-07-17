import fsPromises from "fs/promises"

import WebSocket from "ws"

import { createClient } from "graphql-ws"

if (process.argv.length <= 3) {
  console.log("Please provide the path to the endpoint and path to gql file.")
  process.exit(1)
}

const url = process.argv[2]
const filePath = process.argv[3]
const client = createClient({
  url,
  webSocketImpl: WebSocket,
})

const startSubscription = async () => {
  try {
    const data = await fsPromises.readFile(filePath, "utf8")

    await client.subscribe(
      {
        query: data,
        // May need to add variables
      },
      {
        next: (data) => console.log(`Data: ${JSON.stringify(data)}\n`),
        error: (err) => console.log(`Error: ${JSON.stringify(err)}\n`),
        complete: () => console.log("Completed\n"),
      },
    )
  } catch (err) {
    console.log(`Error reading file: ${err}\n`)
    process.exit(1)
  }
}

startSubscription()
