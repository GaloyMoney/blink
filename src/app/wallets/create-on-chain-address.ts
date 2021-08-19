import { TxDecoder } from "@domain/bitcoin/onchain"
import { OnChainService } from "@services/lnd/onchain-service"
import { WalletsRepository } from "@services/mongoose"

export const createOnChainAddress = async (
  walletId: WalletId,
): Promise<OnChainAddress | ApplicationError> => {
  const onChain = OnChainService(TxDecoder(process.env.NETWORK as BtcNetwork))
  if (onChain instanceof Error) return onChain

  const addressIdentifier = await onChain.createOnChainAddress()
  if (addressIdentifier instanceof Error) return addressIdentifier

  const wallets = WalletsRepository()
  const wallet = await wallets.findById(walletId)
  if (wallet instanceof Error) return wallet
  wallet.onChainAddressIdentifiers.push(addressIdentifier)

  const result = await wallets.update(wallet)
  if (result instanceof Error) return result

  return addressIdentifier.address
}
