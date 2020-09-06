
export class AdminWallet {

  constructor() {}

  getBalanceSheet() {
    return new Promise((resolve, reject) => {
      resolve({equity: - 1 * 10 ** 8}) // 1 BTC in sats
    })
  }

}