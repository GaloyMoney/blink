import { ScopesOauth2 } from "@/domain/authorization"

import { GT } from "@/graphql/index"

const Scope = GT.Enum({
  name: "Scope",
  values: {
    READ: { value: ScopesOauth2.Read },
    RECEIVE: { value: ScopesOauth2.Receive },
    WRITE: { value: ScopesOauth2.Write },
  },
})

export default Scope
