import { GT } from "@graphql/index"

const ExpectedConfirmationTime = new GT.Enum({
  name: "ExpectedConfirmationTime",
  values: {
    NEXT_BLOCK: {},
    NEXT_HOUR: {},
    NEXT_DAY: {},
    NEXT_WEEK: {},
  },
})

export default ExpectedConfirmationTime
