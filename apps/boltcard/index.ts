// server.js

import express from "express"
import bodyParser from "body-parser"

import { boltcardRouter } from "./router"

// loading router
import { lnurlw } from "./lnurlw"
import { callback } from "./callback"
import { createboltcard } from "./new"
import { createTable } from "./knex"

lnurlw
callback
createboltcard

await createTable()

const app = express()
const PORT = 3000

// Middleware to parse POST requests
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Use the router
app.use(boltcardRouter)

// Start the server
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`)
})
