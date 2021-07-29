import { Subscriber } from "zeromq"
import { bitcoindDefaultClient } from "src/bitcoind"
import { baseLogger } from "src/logger"

export const SUB_ADDR_BLOCK = `tcp://${process.env.BITCOINDADDR}:28332` // TODO? port
export const SUB_ADDR_TX = `tcp://${process.env.BITCOINDADDR}:28333`

enum EVENTS {
  RAW_BLOCK = "rawblock",
  RAW_TX = "rawtx",
  // HASH_BLOCK = "hashblock",
  // HASH_TX = "hashtx",
}

export async function receiveRawBlockSubscriber() {
  const sock = new Subscriber()
  sock.connect(SUB_ADDR_BLOCK)
  sock.subscribe(EVENTS.RAW_BLOCK)

  async function worker() {
    for await (const [topic, msg] of sock) {
      if (topic.toString() === EVENTS.RAW_BLOCK) {
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
  const sock = new Subscriber()
  sock.connect(SUB_ADDR_TX)
  sock.subscribe(EVENTS.RAW_TX)

  async function worker() {
    for await (const [topic, msg] of sock) {
      if (topic.toString() === EVENTS.RAW_TX) {
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
