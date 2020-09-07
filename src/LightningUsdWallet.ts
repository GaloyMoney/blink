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
  constructor({ uid }: ILightningWalletUser) {
    super({ uid, currency: "USD" })
  }

  async addInvoice({ value, memo }: IAddUSDInvoiceRequest): Promise<string> {
    if (!value) {
      throw Error("USD Wallet need to have set an amount when creating an invoice")
    }

    const price = new Price()
    const lastPrices = await price.lastPrice() // sats/usd
    const satValue = value / lastPrices

    // TODO: timeout should be ~ 1 min
    const request = await super.addInvoice({value: satValue, memo})

    // inefficient, we are doing 2 consecutives requests on the same item/collection
    // but better for now to use inheritence
    await InvoiceUser.updateOne({_id: getHash(request)}, {usd: value})

    return request
  }
}