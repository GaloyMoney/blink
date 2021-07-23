import { GT } from "../index"

const AccountLevel = new GT.Enum({
  name: "AccountLevel",
  values: {
    ONE: { value: 1 },
    TWO: { value: 2 },
  },
})

export default AccountLevel
