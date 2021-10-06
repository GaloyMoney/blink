import { GT } from "@graphql/index"

export const txDirectionValues = {
  SEND: {},
  RECEIVE: {},
}

const TxDirection = new GT.Enum({
  name: "TxDirection",
  values: txDirectionValues,
})

export default TxDirection
