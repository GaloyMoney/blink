import { IAddInvoiceRequest } from "../../../../common/types"

export interface IWallet {
  getCurrency(): string
  getBalance(): Promise<number>
  getTransactions(): any // TODO
  getInfo(): Promise<object>
}

export interface ILightningWallet extends IWallet {
  payInvoice({invoice: string}): Promise<any> // TODO
  addInvoice(IAddInvoiceRequest): Promise<any> // TODO
}

export interface IFiatWallet extends IWallet {
  // pay(): Promise<any> // TODO
  // withdraw(): Promise<any> // TODO
  addFunds({amount: number})
}

export interface FiatTransaction {
  amount: number, 
  date: number,
  icon: string,
  name: string,
  onchain_tx?: string, // should be HEX?
}