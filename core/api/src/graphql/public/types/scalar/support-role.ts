import { DomainSupportRole } from "@/domain/conversation"
import { GT } from "@/graphql/index"

const SupportRole = GT.Enum({
  name: "SupportRole",
  values: {
    USER: { value: DomainSupportRole.User },
    ASSISTANT: { value: DomainSupportRole.Assistant },
  },
})

export default SupportRole
