import { AdminWallet } from "./wallet";
const lnService = require('ln-service');
const util = require('util')

export class FiatAdminWallet extends AdminWallet {
  protected _currency = "USD"

  get accountPath(): string {
    return `Liabilities:Shareholder`
  }

}