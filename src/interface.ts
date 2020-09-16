
export interface IWallet {
  getBalance(): Promise<number>
  getTransactions(): any // TODO
  getInfo(): Promise<object>
}

export interface ILightningWallet extends IWallet {
  payInvoice({invoice: string}): Promise<any> // TODO
  addInvoice(IAddBTCInvoiceRequest): Promise<any> // TODO
}

export interface FiatTransaction {
  amount: number, 
  date: number,
  icon: string,
  name: string,
  onchain_tx?: string, // should be HEX?
}

export interface Auth {
  macaroon: string,
  cert: string,
  socket: string,
}