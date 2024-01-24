import { PayoutSpeed as DomainPayoutSpeed } from "@domain/bitcoin/onchain"

import { GT } from "@graphql/index"
import Memo from "@graphql/shared/types/scalar/memo"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import CentAmount from "@graphql/public/types/scalar/cent-amount"
import OnChainAddress from "@graphql/shared/types/scalar/on-chain-address"
import PaymentSendPayload from "@graphql/public/types/payload/payment-send"
import PayoutSpeed from "@graphql/public/types/scalar/payout-speed"
import WalletId from "@graphql/shared/types/scalar/wallet-id"

// import { Wallets } from "@app"

// FLASH FORK: import ibex dependencies
import Ibex from "@services/ibex"
import { IbexEventError } from "@services/ibex/errors"

const OnChainUsdPaymentSendInput = GT.Input({
  name: "OnChainUsdPaymentSendInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
    address: { type: GT.NonNull(OnChainAddress) },
    amount: { type: GT.NonNull(CentAmount) },
    speed: {
      type: PayoutSpeed,
      defaultValue: DomainPayoutSpeed.Fast,
    },
    memo: { type: Memo },
  }),
})

const OnChainUsdPaymentSendMutation = GT.Field<
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
    input: { type: GT.NonNull(OnChainUsdPaymentSendInput) },
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
    // const result = await Wallets.payOnChainByWalletIdForUsdWallet({
    //   senderAccount: domainAccount,
    //   senderWalletId: walletId,
    //   amount,
    //   address,
    //   speed,
    //   memo,
    // })
    if (!domainAccount) throw new Error("Authentication required")

    const resp = await Ibex.sendToAddressV2({
      accountId: walletId,
      address,
      amount: amount / 100,
    })

    if (resp instanceof IbexEventError) {
      return { status: "failed", errors: [mapAndParseErrorForGqlResponse(resp)] }
    }

    return {
      errors: [],
      status: resp.status,
    }

    // const PayOnChainAddress = await requestIBexPlugin(
    //   "POST",
    //   IbexRoutes.OnChainPayment,
    //   {},
    //   {
    //     accountId: walletId,
    //     address,
    //     amount: amount / 100,
    //   },
    // )
      // const result: PayOnChainByWalletIdResult = {
      //   status: {
      //     value:
      //       PayOnChainAddress.data["data"]["status"] === "INITIATED"
      //         ? "pending"
      //         : PayOnChainAddress.data["data"]["status"] === "MEMPOOL"
      //         ? "pending"
      //         : PayOnChainAddress.data["data"]["status"] === "BLOCKCHAIN"
      //         ? "pending"
      //         : PayOnChainAddress.data["data"]["status"] === "CONFIRMED"
      //         ? "success"
      //         : PayOnChainAddress.data["data"]["status"] === "FAILED"
      //         ? "failed"
      //         : "pending",
      //   },
      //   payoutId: PayOnChainAddress.data["data"]["transactionHub"]["id"],
      // }
  },
})

export default OnChainUsdPaymentSendMutation
