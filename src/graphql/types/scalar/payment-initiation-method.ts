import { GT } from "@graphql/index"
import { PaymentInitiationMethod as DomainPaymentInitiationMethod } from "@domain/wallets"

const PaymentInitiationMethod = new GT.Enum({
  name: "PaymentInitiationMethod",
  values: {
    WALLET_NAME: { value: DomainPaymentInitiationMethod.WalletName },
    ON_CHAIN: { value: DomainPaymentInitiationMethod.OnChain },
    LIGHTNING: { value: DomainPaymentInitiationMethod.Lightning },
  },
})

export default PaymentInitiationMethod
