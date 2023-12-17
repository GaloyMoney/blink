const http = require("http")

const PORT = 8080

const server = http.createServer((req, res) => {
  let body = []
  req
    .on("data", (chunk) => {
      body.push(chunk)
    })
    .on("end", () => {
      body = Buffer.concat(body).toString()
      console.log(body)
      res.end("Received")
    })
})

server.listen(PORT, () => {
  console.error(`Server listening on port ${PORT}`)
})
