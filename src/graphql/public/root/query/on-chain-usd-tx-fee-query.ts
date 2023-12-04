import { PayoutSpeed as DomainPayoutSpeed } from "@domain/bitcoin/onchain"
import { WalletCurrency } from "@domain/shared"

// import { Wallets } from "@app"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"

import CentAmount from "@graphql/public/types/scalar/cent-amount"
import OnChainAddress from "@graphql/shared/types/scalar/on-chain-address"
import PayoutSpeed from "@graphql/public/types/scalar/payout-speed"
import WalletId from "@graphql/shared/types/scalar/wallet-id"

import OnChainUsdTxFee from "@graphql/public/types/object/onchain-usd-tx-fee"

import { normalizePaymentAmount } from "../../../shared/root/mutation"

// FLASH FORK: import ibex dependencies

import { IbexRoutes } from "../../../../services/IbexHelper/Routes"

import { requestIBexPlugin } from "../../../../services/IbexHelper/IbexHelper"

const OnChainUsdTxFeeQuery = GT.Field<null, GraphQLPublicContextAuth>({
  type: GT.NonNull(OnChainUsdTxFee),
  args: {
    walletId: { type: GT.NonNull(WalletId) },
    address: { type: GT.NonNull(OnChainAddress) },
    amount: { type: GT.NonNull(CentAmount) },
    speed: {
      type: PayoutSpeed,
      defaultValue: DomainPayoutSpeed.Fast,
    },
  },
  resolve: async (_, args, { domainAccount }) => {
    const { walletId, address, amount, speed } = args
    for (const input of [walletId, address, amount, speed]) {
      if (input instanceof Error) throw input
    }
    if (!domainAccount) throw new Error("Authentication required")
    // FLASH FORK: use IBEX to send on-chain payment
    // const fee = await Wallets.getOnChainFeeForUsdWallet({
    //   walletId,
    //   account: domainAccount as Account,
    //   amount,
    //   address,
    //   speed,
    // })
    const feeEndpoint = `${IbexRoutes.OnChainFee}?address=${address}&amount=${
      amount / 100
    }&currency=3`
    const PayOnChainFee = await requestIBexPlugin("GET", feeEndpoint, {}, {})
    if (
      PayOnChainFee &&
      PayOnChainFee.data &&
      PayOnChainFee.data["data"] &&
      PayOnChainFee.data["data"]["fee"]
    ) {
      const fee: ApplicationError | PaymentAmount<WalletCurrency> = {
        amount: BigInt(Math.round(PayOnChainFee.data["data"]["fee"] * 100)),
        currency: WalletCurrency.Usd,
      }

      if (fee instanceof Error) throw mapError(fee)

      return {
        amount: normalizePaymentAmount(fee).amount,
      }
    }
  },
})

export default OnChainUsdTxFeeQuery
