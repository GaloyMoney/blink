import { GT } from "@graphql/index"

const TxStatus = new GT.Enum({
  name: "TxStatus",
  values: {
    PENDING: {},
    SUCCESS: {},
    FAILURE: {},
  },
})

export default TxStatus
