import { LightningMixin } from "./Lightning";
import { InvoiceUser } from "./mongodb";
import { Price } from "./priceImpl";
import { IAddUSDInvoiceRequest, ILightningWalletUser } from "./types";
import { getHash } from "./utils";
import { UserWallet } from "./wallet";
const using = require('bluebird').using

/**
 * this represents a user wallet
 */
export class LightningUsdWallet extends LightningMixin(UserWallet) {
  readonly currency = "USD" 

  constructor({ uid }: ILightningWalletUser) {
    super({ uid, currency: "USD" })
  }

  async addInvoice({ value, memo }: IAddUSDInvoiceRequest): Promise<string> {
    if (!value) {
      throw Error("USD Wallet need to have set an amount when creating an invoice")
    }

    const usd = value
    const lastPrices = await new Price().lastPrice() // sats/usd
    const satValue = value / lastPrices

    // TODO: timeout should be ~ 1 min
    const request = await super.addInvoiceInternal({sats: satValue, usd, currency: this.currency, memo})

    return request
  }
}