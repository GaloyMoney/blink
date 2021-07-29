import { Subscriber } from "zeromq"
import { bitcoindDefaultClient } from "src/bitcoind"
import { baseLogger } from "src/logger"

export const SUB_ADDR_BLOCK = `tcp://${process.env.BITCOINDADDR}:28332` // TODO? port
export const SUB_ADDR_TX = `tcp://${process.env.BITCOINDADDR}:28333`

export async function receiveRawBlockSubscriber() {
  const subscribeTopic = "rawblock" // "rawblock", "hashblock", "rawtx", or "hashtx"

  const sock = new Subscriber()
  sock.connect(SUB_ADDR_BLOCK)
  sock.subscribe(subscribeTopic)

  async function worker() {
    for await (const [topic, msg] of sock) {
      if (topic.toString() === subscribeTopic) {
        const rawTx = msg.toString("hex")
        baseLogger.warn(`rawTx.substring: ${rawTx.substring(0, 64)}`)
      }
    }
  }

  // eslint-disable-next-line require-await
  worker() // no await
  return await sock
}

export async function receiveRawTxSubscriber() {
  const subscribeTopic = "rawtx"

  const sock = new Subscriber()
  sock.connect(SUB_ADDR_TX)
  sock.subscribe(subscribeTopic)

  async function worker() {
    for await (const [topic, msg] of sock) {
      if (topic.toString() === subscribeTopic) {
        const rawTx = msg.toString("hex")
        const tx = await bitcoindDefaultClient.decodeRawTransaction({ hexstring: rawTx })
        baseLogger.warn(`tx: ${JSON.stringify(tx)}`)
      }
    }
  }

  // eslint-disable-next-line require-await
  worker() // no await
  return await sock
}
