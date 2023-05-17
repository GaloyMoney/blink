import { BriaClient } from "./client"

export const BriaOnChainService = (walletName: BriaWalletName): INewOnChainService => {
  const bria = BriaClient(walletName)

  const queuePayoutToAddress = async ({
    address,
    amount,
    priority,
    description,
  }: QueuePayoutToAddressArgs): Promise<PayoutId | OnChainServiceError> => {
    const payoutId = await bria.submitPayout({ priority, address, amount })
    if (payoutId instanceof Error) return payoutId

    return payoutId
  }

  return { queuePayoutToAddress }
}
