import { GT } from "@graphql/index"
import { TxStatus as DomainTxStatus } from "@domain/wallets"

const TxStatus = new GT.Enum({
  name: "TxStatus",
  values: {
    PENDING: { value: DomainTxStatus.Pending },
    SUCCESS: { value: DomainTxStatus.Success },
    FAILURE: { value: DomainTxStatus.Failure },
  },
})

export default TxStatus
