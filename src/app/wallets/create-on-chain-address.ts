/*
  FLASH FORK
  Origin Galoy code contained additional logic to lookup by requestId, check addresses on-chain, and check account limits. 
  Check Git history for missing functionality 
*/
import { AccountValidator } from "@domain/accounts"
import {
  AccountsRepository,
  WalletsRepository,
} from "@services/mongoose"
import Ibex from "@services/ibex"
import { IbexEventError } from "@services/ibex/errors"

export const createOnChainAddress = async ({
    walletId,
    requestId, // TODO: Check uses of this unused parameter for potential bugs
  }: {
    walletId: WalletId
    requestId?: OnChainAddressRequestId
  }) => {
    const wallet = await WalletsRepository().findById(walletId)
    if (wallet instanceof Error) return wallet
    const account = await AccountsRepository().findById(wallet.accountId)
    if (account instanceof Error) return account
    const accountValidator = AccountValidator(account)
    if (accountValidator instanceof Error) return accountValidator
    
    const resp = await Ibex.generateBitcoinAddress({ accountId: walletId })
    if (resp instanceof IbexEventError) return resp
    else if (!resp.address) return new IbexEventError("Address not returned")
    else return resp.address
  }
