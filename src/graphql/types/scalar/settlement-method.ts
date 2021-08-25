import { SettlementMethod as DomainSettlementMethod } from "@domain/wallets"
import { GT } from "@graphql/index"

const SettlementMethod = new GT.Enum({
  name: "SettlementMethod",
  values: {
    INTRA_LEDGER: { value: DomainSettlementMethod.IntraLedger },
    ON_CHAIN: { value: DomainSettlementMethod.OnChain },
    LIGHTNING: { value: DomainSettlementMethod.Lightning },
  },
})

export default SettlementMethod
