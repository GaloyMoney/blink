import { getCurrentPriceAsDisplayPriceRatio, usdFromBtcMidPriceFn } from "@app/prices"
import { priceAmountFromDisplayPriceRatio } from "@domain/fiat"
import { WalletAddressReceiver } from "@domain/wallet-on-chain/wallet-address-receiver"
import {
  NewDepositFeeCalculator,
  PaymentInitiationMethod,
  SettlementMethod,
  TxStatus,
} from "@domain/wallets"

import { DealerPriceService } from "@services/dealer-price"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"
import { PendingOnChainTransactionsRepository } from "@services/mongoose/pending-onchain-transactions"

const dealer = DealerPriceService()

export const addPendingTransaction = async ({
  txId,
  vout,
  satoshis,
  address,
}: UtxoDetected) => {
  // Step 1: walletId from address
  const wallet = await WalletsRepository().findByAddress(address)
  if (wallet instanceof Error) return wallet

  // Step 2: Calculate deposit fee?
  const account = await AccountsRepository().findById(wallet.accountId)
  if (account instanceof Error) return account

  const satsFee = NewDepositFeeCalculator().onChainDepositFee({
    amount: satoshis,
    ratio: account.depositFeeRatio,
  })
  if (satsFee instanceof Error) return satsFee

  // Step 3: Calculate display amounts
  //         (should this be done on the fly instead, since
  //          it'll likely change?)
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

  // Step 4
  const pendingTransaction: NewWalletOnChainSettledTransaction = {
    status: TxStatus.Pending,

    id: txId,
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

    memo: "",
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

  return PendingOnChainTransactionsRepository().persistNew(pendingTransaction)
}
