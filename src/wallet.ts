import { createMainBook } from "./db"

export class Wallet {
  protected readonly uid: string
  protected _mainBook

  constructor({uid}) {
    console.log("uid:", uid)
    this.uid = uid
  }

  async getMainBook () {
    if (this._mainBook) {
        return this._mainBook
    }

    this._mainBook = await createMainBook()
    return this._mainBook
  }
}