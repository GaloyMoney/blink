import { UserWallet } from "./wallet";
import { LightningMixin } from "./Lightning";
import { InvoiceUser } from "./mongodb";
import { Price } from "./priceImpl";
import { Currency, IAddInvoiceRequest } from "./types";
import { getHash } from "./utils";
const using = require('bluebird').using

interface ILightningWalletUser {
  uid: string,
  currency?: Currency
}

/**
 * this represents a user wallet
 */
export class LightningUsdWallet extends LightningMixin(UserWallet) {
  constructor({ uid, currency = "USD" }: ILightningWalletUser) {
    super({ uid, currency })
  }

  async addInvoice({ value, memo }: IAddInvoiceRequest) {
    const price = new Price()
    const lastPrices = await price.lastCached()[-1] // sats/usd

    const satValue: number = value as number * lastPrices
    
    // TODO: timeout should be ~ 1 min
    const request = await super.addInvoice({value: satValue, memo})

    // inefficient, we are doing 2 request
    // but better for now to use inheritence
    await InvoiceUser.findAndUpdate({_id: getHash(request)}, {usd: value})

    return request
  }
}