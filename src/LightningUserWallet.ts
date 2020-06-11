import { book } from "medici";
import moment from "moment";
import { LightningMixin } from "./Lightning";
import { LightningAdminWallet } from "./LightningAdminImpl";
import { ILightningTransaction, OnboardingEarn, TransactionType } from "./types";
import { getAuth } from "./utils";
import { UserWallet } from "./wallet";
const lnService = require('ln-service');
const util = require('util')
const mongoose = require("mongoose");

type IType = "invoice" | "payment" | "earn"

const formatInvoice = (type: IType, memo: String | undefined, pending: Boolean | undefined): String => {
  if (pending) {
    return `Waiting for payment confirmation`
  } else {
    if (memo) {
      return memo
    } 
    // else if (invoice.htlcs[0].customRecords) {
      // FIXME above syntax from lnd, not lnService script "overlay"
      // TODO for lnd keysend 
    // } 
    else {
      return type === "payment" ? 
          `Payment sent` 
        : type === "invoice" ? 
            `Payment received`
          : "Earn"
    }
  }
}

const formatType = (type: IType, pending: Boolean | undefined): TransactionType | Error => {
    if (type === "invoice") {
        return pending ? "unconfirmed-invoice" : "paid-invoice"
    } 
    
    if (type === "payment") {
        return pending ? "inflight-payment" : "payment"
    }

    if (type === "earn") {
        return "earn"
    }

    if (type === "onchain_receipt") {
        return "onchain_receipt"
    }

    throw Error("incorrect type for formatType")
}

/**
 * this represents a user wallet
 */
export class LightningUserWallet extends LightningMixin(UserWallet) {
    protected readonly lnd: object;
    protected _currency = "BTC"

    constructor({uid}: {uid: string}) {
        super({uid})
        this.lnd = lnService.authenticatedLndGrpc(getAuth()).lnd
    }

    async getBalance() {
        // await this.updatePending()
        return super.getBalance()
    }

    async getTransactions(): Promise<Array<ILightningTransaction>> {
        // await this.updatePending()

        const MainBook = new book("MainBook")

        const { results } = await MainBook.ledger({
            account: this.accountPath,
            currency: this.currency,
            // start_date: startDate,
            // end_date: endDate
          })
          // TODO we could duplicated pending/type to transaction,
          // this would avoid to fetch the data from hash collection and speed up query

        const results_processed = results.map((item) => ({
            created_at: moment(item.timestamp).unix(),
            amount: item.debit - item.credit,
            description: formatInvoice(item.type, item.memo, item.pending),
            hash: item.hash,
            fee: item.fee,
            // destination: TODO
            type: formatType(item.type, item.pending),
            id: item._id,
        }))

        return results_processed
    }

    async addEarn(ids) {
        // TODO move out lightningUser
        // TODO FIXME XXX: this function is succeptible to race condition.
        // add a lock or db-level transaction to prevent this
        // we could use something like this: https://github.com/chilts/mongodb-lock
        
        const lightningAdminWallet = new LightningAdminWallet()
        const User = mongoose.model("User")

        const result: object[] = []

        for (const id of ids) {
            const amount = OnboardingEarn[id]

            const userPastState = await User.findOneAndUpdate(
                {_id: this.uid}, 
                { $push: { earn: id } },
                { upsert: true} 
            )
    
            if ((userPastState.earn?.findIndex(item => item === id) ?? -1 ) === -1) {
                await lightningAdminWallet.addFunds({amount, uid: this.uid, memo: id, type: "earn"})
            }
    
            result.push({id, completed: true})
        }

        return result
    }

    async setLevel({level}) {
        // FIXME this should be in User and not tight to Lightning // use Mixins instead
        const User = mongoose.model("User")
        return await User.findOneAndUpdate({_id: this.uid}, {level}, {new: true, upsert: true} )
    }
}