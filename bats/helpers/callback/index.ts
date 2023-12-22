import http from "http"

const PORT: number = 8080

const server: http.Server = http.createServer(
  (req: http.IncomingMessage, res: http.ServerResponse) => {
    let body: Buffer[] = []
    req
      .on("data", (chunk: Buffer) => {
        body.push(chunk)
      })
      .on("end", () => {
        const parsedBody: string = Buffer.concat(body).toString()
        console.log(parsedBody)
        res.end("Received")
      })
  },
)

server.listen(PORT, () => {
  console.error(`Server listening on port ${PORT}`)
})
