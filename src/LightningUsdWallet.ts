import { customerPath } from "./ledger";
import { LightningMixin } from "./Lightning";
import { Price } from "./priceImpl";
import { IAddUSDInvoiceRequest, ILightningWalletUser } from "./types";
import { UserWallet } from "./wallet";

/**
 * this represents a user wallet
 */
export class LightningUsdWallet extends LightningMixin(UserWallet) {
  readonly currency = "USD" 

  get accountPath(): string {
    return customerPath(this.uid)
  }

  constructor(args: ILightningWalletUser) {
    super({ currency: "USD", ...args })
  }

  async addInvoice({ value, memo }: IAddUSDInvoiceRequest): Promise<string> {
    if (!value) {
      throw Error("USD Wallet need to have set an amount when creating an invoice")
    }

    const usd = value
    const satValue = value / this.lastPrice

    // TODO: timeout should be ~ 1 min
    const request = await super.addInvoiceInternal({sats: satValue, usd, currency: this.currency, memo})

    return request
  }
}