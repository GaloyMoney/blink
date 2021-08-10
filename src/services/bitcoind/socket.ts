import { Subscriber } from "zeromq"

// TODO WIP

// export const SUB_ADDR_BLOCK = `tcp://${process.env.BITCOINDADDR}:28332` // TODO port env variable?
export const SUB_ADDR_TX = `tcp://${process.env.BITCOINDADDR}:28333`

// singleton
let sockTx!: Subscriber
if (!sockTx) {
  sockTx = new Subscriber()
  sockTx.connect(SUB_ADDR_TX)
}

export { sockTx }
