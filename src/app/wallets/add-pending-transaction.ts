import { getCurrentPriceAsDisplayPriceRatio, usdFromBtcMidPriceFn } from "@app/prices"
import { DuplicateKeyForPersistError } from "@domain/errors"
import { priceAmountFromDisplayPriceRatio } from "@domain/fiat"
import { WalletAddressReceiver } from "@domain/wallet-on-chain/wallet-address-receiver"
import {
  NewDepositFeeCalculator,
  PaymentInitiationMethod,
  SettlementMethod,
} from "@domain/wallets"

import { DealerPriceService } from "@services/dealer-price"
import {
  AccountsRepository,
  WalletOnChainPendingReceiveRepository,
  WalletsRepository,
} from "@services/mongoose"

const dealer = DealerPriceService()

export const addPendingTransaction = async ({
  txId,
  vout,
  satoshis,
  address,
}: {
  txId: OnChainTxHash
  vout: OnChainTxVout
  satoshis: BtcPaymentAmount
  address: OnChainAddress
}): Promise<true | ApplicationError> => {
  const wallet = await WalletsRepository().findByAddress(address)
  if (wallet instanceof Error) return wallet

  const account = await AccountsRepository().findById(wallet.accountId)
  if (account instanceof Error) return account

  const satsFee = NewDepositFeeCalculator().onChainDepositFee({
    amount: satoshis,
    ratio: account.depositFeeRatio,
  })
  if (satsFee instanceof Error) return satsFee

  const walletAddressReceiver = await WalletAddressReceiver({
    walletAddress: {
      address,
      recipientWalletDescriptor: wallet,
    },
    receivedBtc: satoshis,
    satsFee,
    usdFromBtc: dealer.getCentsFromSatsForImmediateBuy,
    usdFromBtcMidPrice: usdFromBtcMidPriceFn,
  })
  if (walletAddressReceiver instanceof Error) return walletAddressReceiver
  const { amountToCreditReceiver: settlementAmount, bankFee: settlementFee } =
    walletAddressReceiver.settlementAmounts()

  const displayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
    currency: account.displayCurrency,
  })
  if (displayPriceRatio instanceof Error) {
    return displayPriceRatio
  }

  const pendingTransaction: WalletOnChainPendingTransaction = {
    walletId: wallet.id,
    settlementAmount,
    settlementFee,
    settlementCurrency: wallet.currency,
    settlementDisplayAmount: displayPriceRatio.convertFromWallet(
      walletAddressReceiver.btcToCreditReceiver,
    ),
    settlementDisplayFee: displayPriceRatio.convertFromWalletToCeil(
      walletAddressReceiver.btcBankFee,
    ),
    settlementDisplayPrice: priceAmountFromDisplayPriceRatio(displayPriceRatio),

    createdAt: new Date(Date.now()),
    initiationVia: {
      type: PaymentInitiationMethod.OnChain,
      address,
    },
    settlementVia: {
      type: SettlementMethod.OnChain,
      transactionHash: txId,
      vout,
    },
  }

  const res = await WalletOnChainPendingReceiveRepository().persistNew(pendingTransaction)
  if (res instanceof Error && !(res instanceof DuplicateKeyForPersistError)) {
    return res
  }

  return true
}
