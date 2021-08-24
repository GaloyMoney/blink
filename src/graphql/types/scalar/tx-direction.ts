import { GT } from "@graphql/index"

const TxDirection = new GT.Enum({
  name: "TxDirection",
  values: {
    SEND: {},
    RECEIVE: {},
  },
})

export default TxDirection
