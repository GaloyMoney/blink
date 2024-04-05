import { AccountStatus as DomainAccountStatus } from "@/domain/accounts"
import { GT } from "@/graphql/index"

const AccountStatus = GT.Enum({
  name: "AccountStatus",
  values: {
    NEW: { value: DomainAccountStatus.New },
    PENDING: { value: DomainAccountStatus.Pending },
    ACTIVE: { value: DomainAccountStatus.Active },
    LOCKED: { value: DomainAccountStatus.Locked },
    CLOSED: { value: DomainAccountStatus.Closed },
  },
})

export default AccountStatus
