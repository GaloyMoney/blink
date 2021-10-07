import { GT } from "@graphql/index"

export const txDirectionValues = {
  SEND: "send",
  RECEIVE: "receive",
} as const

const TxDirection = new GT.Enum({
  name: "TxDirection",
  values: {
    SEND: { value: txDirectionValues.SEND },
    RECEIVE: { value: txDirectionValues.RECEIVE },
  },
})

export default TxDirection
