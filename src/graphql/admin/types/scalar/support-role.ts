import { GT } from "@graphql/index"
import { SupportRole as DomainSupportRole } from "@domain/authorization"

const SupportRole = GT.Enum({
  name: "SupportRole",
  values: {
    LEVEL1: { value: DomainSupportRole.Level1 },
    LEVEL2: { value: DomainSupportRole.Level2 },
  },
})

export default SupportRole
