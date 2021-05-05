
export interface Balances {
  BTC: number,
  USD: number,
  total_in_BTC: number,
  total_in_USD: number,
}

export interface IWallet {
  getBalances(lock?): Promise<Balances>
  getTransactions(): any // TODO
  getInfo(): Promise<object>
}

export interface IUpdatePending {
  after?: number | undefined,
  onchain?: boolean | undefined,
  lock?: any /* FIXME */ | undefined,
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