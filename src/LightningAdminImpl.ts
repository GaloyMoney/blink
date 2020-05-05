import { ILightningWallet } from "./interface";
import { UserWallet, AdminWallet } from "./wallet";
const lnService = require('ln-service');
const util = require('util')

export class LightningAdminWallet extends AdminWallet {
  // protected readonly lnd: object;
  protected _currency = "BTC"

  get accountPath(): string {
    return `Assets:Reserve`
  }

}