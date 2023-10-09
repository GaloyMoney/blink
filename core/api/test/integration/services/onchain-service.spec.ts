import { OnChainAddressAlreadyCreatedForRequestIdError } from "@/domain/bitcoin/onchain"
import { WalletCurrency } from "@/domain/shared"
import { OnChainService } from "@/services/bria"

const onchain = OnChainService()

describe("onChainAddress", () => {
  it("can apply requestId as idempotency key when creating new address", async () => {
    const walletDescriptor: WalletDescriptor<"BTC"> = {
      id: "walletId" as WalletId,
      currency: WalletCurrency.Btc,
      accountId: "AccountId" as AccountId,
    }
    const args = {
      walletDescriptor,
      requestId: ("requestId #" +
        (Math.random() * 1_000_000).toFixed()) as OnChainAddressRequestId,
    }

    const identifier = await onchain.getAddressForWallet(args)
    expect(identifier).not.toBeInstanceOf(Error)

    const identifierFromRetry = await onchain.getAddressForWallet(args)
    expect(identifierFromRetry).toBeInstanceOf(
      OnChainAddressAlreadyCreatedForRequestIdError,
    )
  })
})
