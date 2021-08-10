import EventEmitter from "events"

export const SUB_ADDR_BLOCK = `tcp://${process.env.BITCOINDADDR}:28332` // TODO port env variable?
export const SUB_ADDR_TX = `tcp://${process.env.BITCOINDADDR}:28333`

// TODO lifecycle (one detected by the other?)

export enum GALOY_BITCOIND_EVENTS { // TODO Typically, event names are camel-cased strings (https://nodejs.org/api/events.html#events_events)
  BLOCK = "block_bitcoind",
  CHAIN_TRANSACTION = "chain_transaction_bitcoind",
}

export enum BITCOIND_EVENTS {
  RAW_BLOCK = "rawblock",
  RAW_TX = "rawtx",
  // HASH_BLOCK = "hashblock",
  // HASH_TX = "hashtx",
}

export async function receiveRawBlockSubscriber(sock): Promise<EventEmitter> {
  async function worker() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const [topic, msg] of sock) {
      // for await (const [topic, msg] of sockBlock) {
      const rawBlock = msg.toString("hex")
      eventEmitter.emit(GALOY_BITCOIND_EVENTS.BLOCK, rawBlock.substring(0, 64)) // this call all listeners synchronously...
    }
  }

  // TODO As a best practice, listeners should always be added for the 'error' events.
  // myEmitter.on('error', (err) => {
  //   console.error('whoops! there was an error');
  // });

  const eventEmitter = new EventEmitter()
  sock.subscribe(BITCOIND_EVENTS.RAW_BLOCK)
  // eslint-disable-next-line require-await
  worker() // no await
  return await eventEmitter
}

export async function receiveRawTxSubscriber(sock): Promise<EventEmitter> {
  async function worker() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const [topic, msg] of sock) {
      // for await (const [topic, msg] of sockTx) {
      const rawTx = msg.toString("hex")
      eventEmitter.emit(GALOY_BITCOIND_EVENTS.CHAIN_TRANSACTION, rawTx)
    }
  }

  const eventEmitter = new EventEmitter()
  sock.subscribe(BITCOIND_EVENTS.RAW_TX)
  // eslint-disable-next-line require-await
  worker() // no await
  return await eventEmitter
}
