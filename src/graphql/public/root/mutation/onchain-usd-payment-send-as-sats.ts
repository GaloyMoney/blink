import { PayoutSpeed as DomainPayoutSpeed } from "@domain/bitcoin/onchain"

import { GT } from "@graphql/index"
import Memo from "@graphql/shared/types/scalar/memo"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import OnChainAddress from "@graphql/shared/types/scalar/on-chain-address"
import PaymentSendPayload from "@graphql/public/types/payload/payment-send"
import PayoutSpeed from "@graphql/public/types/scalar/payout-speed"
import SatsAmount from "@graphql/shared/types/scalar/sat-amount"
import WalletId from "@graphql/shared/types/scalar/wallet-id"

// import { Wallets } from "@app"

// FLASH FORK: import ibex dependencies
import { toCents } from "@domain/fiat"

import { IbexRoutes } from "../../../../services/IbexHelper/Routes"

import { requestIBexPlugin } from "../../../../services/IbexHelper/IbexHelper"

const OnChainUsdPaymentSendAsBtcDenominatedInput = GT.Input({
  name: "OnChainUsdPaymentSendAsBtcDenominatedInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
    address: { type: GT.NonNull(OnChainAddress) },
    amount: { type: GT.NonNull(SatsAmount) },
    speed: {
      type: PayoutSpeed,
      defaultValue: DomainPayoutSpeed.Fast,
    },
    memo: { type: Memo },
  }),
})

const OnChainUsdPaymentSendAsBtcDenominatedMutation = GT.Field<
  null,
  GraphQLPublicContextAuth,
  {
    input: {
      walletId: WalletId | InputValidationError
      address: OnChainAddress | InputValidationError
      amount: number
      memo: Memo | InputValidationError | null
      speed: PayoutSpeed | InputValidationError
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(PaymentSendPayload),
  args: {
    input: { type: GT.NonNull(OnChainUsdPaymentSendAsBtcDenominatedInput) },
  },
  resolve: async (_, args, { domainAccount }) => {
    const { walletId, address, amount, memo, speed } = args.input

    if (walletId instanceof Error) {
      return { errors: [{ message: walletId.message }] }
    }

    if (address instanceof Error) {
      return { errors: [{ message: address.message }] }
    }

    if (memo instanceof Error) {
      return { errors: [{ message: memo.message }] }
    }

    if (speed instanceof Error) {
      return { errors: [{ message: speed.message }] }
    }

    // FLASH FORK: use IBEX to send on-chain payment
    // const result = await Wallets.payOnChainByWalletIdForUsdWalletAndBtcAmount({
    //   senderAccount: domainAccount,
    //   senderWalletId: walletId,
    //   amount,
    //   address,
    //   speed,
    //   memo,
    // })
    if (!domainAccount) throw new Error("Authentication required")
    const PayOnChainAddress = await requestIBexPlugin(
      "POST",
      IbexRoutes.OnChainPayment,
      {},
      {
        accountId: walletId,
        address,
        amount: toCents(amount),
      },
    )
    if (
      PayOnChainAddress &&
      PayOnChainAddress.data &&
      PayOnChainAddress.data["data"]["status"]
    ) {
      const result: PayOnChainByWalletIdResult = {
        status: { value: PayOnChainAddress.data["data"]["status"] },
        payoutId: PayOnChainAddress.data["data"]["transactionHub"]["id"],
      }

      if (result instanceof Error) {
        return { status: "failed", errors: [mapAndParseErrorForGqlResponse(result)] }
      }

      return {
        errors: [],
        status: result.status.value,
      }
    }
  },
})

export default OnChainUsdPaymentSendAsBtcDenominatedMutation
