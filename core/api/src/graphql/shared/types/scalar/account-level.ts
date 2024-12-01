import { GT } from "@/graphql/index"

const AccountLevel = GT.Enum({
  name: "AccountLevel",
  values: {
    ZERO: { value: 0 }, // Limited account capabilities
    ONE: { value: 1 }, // We have the user's phone number
    TWO: { value: 2 }, // We have the user's identity
    THREE: { value: 3 },
  },
})

export default AccountLevel
