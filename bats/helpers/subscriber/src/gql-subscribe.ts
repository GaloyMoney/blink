import fsPromises from "fs/promises"

import WebSocket from "ws"

import { createClient } from "graphql-ws"

if (process.argv.length <= 3) {
  console.log("Please provide the path to the endpoint and path to gql file.")
  process.exit(1)
}

const url = process.argv[3]
const filePath = process.argv[4]
const authToken = process.argv[5]
const variablesString = process.argv[6] || "{}"
let authParam = undefined
if (authToken) {
  if (authToken.startsWith("dev_")) {
    authParam = { "X-API-KEY": authToken }
  } else {
    authParam = { Authorization: `Bearer ${authToken}` }
  }
}
const client = createClient({
  url,
  webSocketImpl: WebSocket,
  connectionParams: authParam
})

const startSubscription = async () => {
  try {
    const data = await fsPromises.readFile(filePath, "utf8")

    let variables = undefined
    try {
      const cleanedVariablesString = variablesString.replace(/\\n/g, '\n')
      variables = JSON.parse(cleanedVariablesString)
    } catch (err) {
      console.log(err)
    }

    await client.subscribe(
      {
        query: data,
        variables,
      },
      {
        next: (data) => console.log(`Data: ${JSON.stringify(data)}`),
        error: (err) => console.log(err, `Error: ${JSON.stringify(err)}`),
        complete: () => console.log("Completed"),
      },
    )
  } catch (err) {
    console.log(`Error reading file: ${err}\n`)
    process.exit(1)
  }
}

startSubscription()
