import { CustomApolloErrorCode } from "@graphql/error"
import { GT } from "@graphql/index"

const values: { [key: string]: { value: CustomApolloErrorCode } } = {}
let key: CustomApolloErrorCodeKey
for (key in CustomApolloErrorCode) {
  values[key] = { value: CustomApolloErrorCode[key] }
}

const AppErrorCode = GT.Enum({
  name: "AppErrorCode",
  values,
})

export default AppErrorCode
