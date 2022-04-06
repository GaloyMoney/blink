import { WalletCurrency } from "@domain/shared"

export * from "./errors"

export const dealerMidPriceFunctions = (dealer: IDealerPriceServiceNew): { usdFromBtcMidPriceFn: UsdFromBtcMidPriceFn, btcFromUsdMidPriceFn: BtcFromUsdMidPriceFn } => {
    
    const usdFromBtcMidPriceFn = async (
        amount: BtcPaymentAmount,
    ): Promise<UsdPaymentAmount | DealerPriceServiceError> => {
        const midPriceRatio = await dealer.getCentsPerSatsExchangeMidRate()
        if (midPriceRatio instanceof Error) return midPriceRatio

        return {
            amount: BigInt(Math.ceil(Number(amount.amount) * midPriceRatio)),
            currency: WalletCurrency.Usd,
        }
    }

    const btcFromUsdMidPriceFn = async (
        amount: UsdPaymentAmount,
    ): Promise<BtcPaymentAmount | DealerPriceServiceError> => {
        const midPriceRatio = await dealer.getCentsPerSatsExchangeMidRate()
        if (midPriceRatio instanceof Error) return midPriceRatio

        return {
            amount: BigInt(Math.ceil(Number(amount.amount) / midPriceRatio)),
            currency: WalletCurrency.Btc,
        }
    }
    return { usdFromBtcMidPriceFn, btcFromUsdMidPriceFn }
}
