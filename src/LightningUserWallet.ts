import Timeout from 'await-timeout';
import moment from "moment";
import { createInvoiceUser, createMainBook, createUser } from "./db";
import { Auth, ILightningWallet } from "./interface";
import { LightningAdminWallet } from "./LightningAdminImpl";
import { IAddInvoiceRequest, ILightningTransaction, OnboardingEarn, TransactionType } from "./types";
import { UserWallet } from "./wallet";
import { intersection } from "lodash"
const lnService = require('ln-service');
const util = require('util')
const mongoose = require("mongoose");

type payInvoiceResult = "success" | "failed" | "pending"
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


// TODO refactor with User wallet
// export class LightningGlobalWallet extends Wallet implements ILightningWallet {
//     protected readonly lnd: object;
    
//     constructor({auth}: {auth: Auth}) {
//         super({uid: null})
//         this.lnd = lnService.authenticatedLndGrpc(auth).lnd;
//     }
    
//     async getBalance() {
//         const balanceInChannels = (await lnService.getChannelBalance({ lnd: this.lnd })).channel_balance;
//         return balanceInChannels;
//     }
// }


/**
 * this represents a user wallet
 */
export class LightningUserWallet extends UserWallet implements ILightningWallet {
    protected readonly lnd: object;
    protected _currency = "BTC"

    constructor({auth, uid}: {auth: Auth, uid: string}) {
        super({uid})
        this.lnd = lnService.authenticatedLndGrpc(auth).lnd
    }

    async updatePending() {
        await this.updatePendingInvoices()
        await this.updatePendingPayment()
        await this.updateOnchainPayment()
    }

    async getBalance() {
        await this.updatePending()
        return super.getBalance()
    }

    async getTransactions(): Promise<Array<ILightningTransaction>> {
        await this.updatePending()

        const MainBook = await createMainBook()

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

    // TODO manage the error case properly. right now there is a mix of string being return
    // or error being thrown. Not sure how this is handled by GraphQL
    async payInvoice({ invoice }): Promise<payInvoiceResult | Error> {
        // TODO add fees accounting

        // TODO replace this with bolt11 utils library
        const { id, tokens, destination, description } = await lnService.decodePaymentRequest({lnd: this.lnd, request: invoice})

        // TODO probe for payment first. 
        // like in `bos probe "payment_request/public_key"`
        // from https://github.com/alexbosworth/balanceofsatoshis

        const MainBook = await createMainBook()
        const Transaction = await mongoose.model("Medici_Transaction")


        // TODO: handle on-us transaction
        console.log({destination})
        

        // probe for Route
        // TODO add private route from invoice
        const {route} = await lnService.probeForRoute({destination, lnd: this.lnd, tokens});
        console.log(util.inspect({route}, {showHidden: false, depth: null}))

        if (!route) {
            throw Error(`internal: there is no route for this payment`)
        }

        const balance = this.getBalance()
        if (balance < tokens + route.safe_fee) {
            throw Error(`cancelled: balance is too low. have: ${balance} sats, need ${tokens}`)
        }


        // we are confident nough that there is a possible payment route. let's move forward

        // reduce balance from customer first
        // TODO this should use a reference (using db transactions) from balance computed above
        // and fail is balance has changed in the meantime to prevent race condition
        
        const obj = {currency: this.currency, hash: id, type: "payment", pending: true, fee: route.safe_fee}

        const entry = await MainBook.entry(description) 
            .debit('Assets:Reserve', tokens + route.safe_fee, obj)
            .credit(this.accountPath, tokens + route.safe_fee, obj)
            .commit()

        // there is 3 scenarios for a payment.
        // 1/ payment succeed is less than TIMEOUT_PAYMENT
        // 2/ the payment fails. we are reverting it. this including voiding prior transaction
        // 3/ payment is still pending after TIMEOUT_PAYMENT.
        // we are timing out the request for UX purpose, so that the client can show the payment is pending
        // even if the payment is still ongoing from lnd.
        // to clean pending payments, another cron-job loop will run in the background.
        try {
            const TIMEOUT_PAYMENT = 5000
            const promise = lnService.payViaRoutes({lnd: this.lnd, routes: [route], id})
            await Timeout.wrap(promise, TIMEOUT_PAYMENT, 'Timeout');

            // FIXME
            // return this.payDetail({
            //     pubkey: details.destination,
            //     hash: details.id,
            //     amount: details.tokens,
            //     routes: details.routes
            // })

            // console.log({result})

        } catch (err) {

            console.log({err, message: err.message, errorCode: err[1]})

            if (err.message === "Timeout") {
                return "pending"
                // TODO processed in-flight payment in separate loop
            }

            console.log(typeof entry._id)

            try {
                // FIXME we should also set pending to false for the other associated transactions
                await Transaction.updateMany({hash: id}, {pending: false, error: err[1]})
                await MainBook.void(entry._id, err[1])
            } catch (err_db) {
                const err_message = `error canceling payment entry ${util.inspect({err_db})}`
                console.error(err_message)
                throw Error(`internal ${err_message}`)
            }

            throw Error(`internal error paying invoice ${util.inspect({err}, false, Infinity)}`)
        }
        
        // success
        await Transaction.updateMany({hash: id}, {pending: false})

        return "success"
    }
    
    // should be run regularly with a cronjob
    // TODO: move to an "admin/ops" wallet
    async updatePendingPayment() {
        
        const MainBook = await createMainBook()

        const Transaction = await mongoose.model("Medici_Transaction")
        const payments = await Transaction.find({account_path: this.accountPathMedici, type: "payment", pending: true})

        for (const payment of payments) {

            let result
            try {
                result = await lnService.getPayment({ lnd: this.lnd, id: payment.hash })
            } catch (err) {
                throw Error('issue fetching payment: ' + err.toString())
            }

            if (result.is_confirmed) {
                // success
                payment.pending = false
                payment.save()
            }

            if (result.is_failed) {
                try {
                    payment.pending = false
                    await payment.save()
                    await MainBook.void(payment._journal, "Payment canceled") // JSON.stringify(result.failed
                } catch (err) {
                    throw Error(`internal: error canceling payment entry ${util.inspect({err})}`)
                }
            }
        }
    }

    async addInvoice({value, memo}: IAddInvoiceRequest) {
        const { request, id } = await lnService.createInvoice({
            lnd: this.lnd,
            tokens: value,
            description: memo,
        })

        const InvoiceUser = await createInvoiceUser() 

        try {
            await new InvoiceUser({
                _id: id,
                uid: this.uid,
                pending: true, 
            }).save()
        } catch (err) {
            throw Error(`internal: error storing invoice to db ${util.inspect({err})}`)
        }

        return request
    }

    async getOnChainAddress(): Promise<String | Error> {

        let address
        const User = await createUser()

        try {
            const format = 'p2wpkh';
            const response = await lnService.createChainAddress({
                lnd: this.lnd,
                format,
            })
            address = response.address
        } catch (err) {
            throw new Error(`internal error getting address ${util.inspect({err})}`)
        }

        try {
            const user = await User.findOne({_id: this.uid})
            if (!user) { // this should not happen. is test that relevant?
                console.error("no user is associated with this address")
                throw new Error(`internal no user`)
            }

            user.onchain_addresses.push(address)
            await user.save()

        } catch (err) {
            throw new Error(`internal error storing invoice to db ${util.inspect({err})}`)
        }

        return address
    }

    async updatePendingInvoice({hash}) {
        // TODO we should have "streaming" / use Notifications for android/iOs to have
        // a push system and not a pull system

        let result

        try {
            // FIXME we should only be able to look at User invoice, 
            // but might not be a strong problem anyway
            // at least return same error if invoice not from user
            // or invoice doesn't exist. to preserve privacy reason and DDOS attack.
            result = await lnService.getInvoice({ lnd: this.lnd, id: hash })
        } catch (err) {
            throw new Error(`issue fetching invoice: ${
                util.inspect({err}, {showHidden: false, depth: null})
            })`)
        }

        if (result.is_confirmed) {

            const MainBook = await createMainBook()
            const InvoiceUser = await createInvoiceUser()        

            try {
                const invoice = await InvoiceUser.findOne({_id: hash, pending: true, uid: this.uid})

                if (!invoice) {
                    return false
                }

                // TODO: use a transaction here
                // const session = await InvoiceUser.startSession()
                // session.withTransaction(
                
                // OR: use a an unique index account / hash / voided
                // may still not avoid issue from discrenpency between hash and the books

                invoice.pending = false
                invoice.save()

                await MainBook.entry()
                    .credit('Assets:Reserve', result.tokens, {currency: "BTC", hash, type: "invoice" }) 
                    .debit(this.accountPath, result.tokens, {currency: "BTC", hash, type: "invoice" })
                    .commit()

                // session.commitTransaction()
                // session.endSession()

                return true

            } catch (err) {
                console.error(err)
                throw new Error(`issue updating invoice: ${err}`)
            }
        }

        return false
    }

    // should be run regularly with a cronjob
    // TODO: move to an "admin/ops" wallet
    async updatePendingInvoices() {
        const InvoiceUser = await createInvoiceUser()
        const invoices = await InvoiceUser.find({uid: this.uid, pending: true})
        
        for (const invoice of invoices) {
            await this.updatePendingInvoice({hash: invoice._id})
        }
    }

    async addEarn(ids) {
        // TODO move out lightningUser
        // TODO FIXME XXX: this function is succeptible to race condition.
        // add a lock or db-level transaction to prevent this
        // we could use something like this: https://github.com/chilts/mongodb-lock
        
        const lightningAdminWallet = new LightningAdminWallet()
        const User = await createUser()

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
        const User = await createUser()
        return await User.findOneAndUpdate({_id: this.uid}, {level}, {new: true, upsert: true} )
    }

    async updateOnchainPayment() {
        const MainBook = await createMainBook()
        const User = await createUser()
        const Transaction = await mongoose.model("Medici_Transaction")

        const {onchain_addresses} = await User.findOne({_id: this.uid})
        
        let result
        try {
            result = await lnService.getChainTransactions({ lnd: this.lnd })
        } catch (err) {
            const err_string = `${util.inspect({err}, {showHidden: false, depth: null})}`
            throw new Error(`issue fetching transaction: ${err_string})`)
        }

        // TODO manage non confirmed transaction
        const incoming_txs = result.transactions.filter(item => !item.is_outgoing && item.is_confirmed)

        //        { block_id: '0000000000000b1fa86d936adb8dea741a9ecd5f6a58fc075a1894795007bdbc',
        //          confirmation_count: 712,
        //          confirmation_height: 1744148,
        //          created_at: '2020-05-14T01:47:22.000Z',
        //          fee: undefined,
        //          id: '5e3d3f679bbe703131b028056e37aee35a193f28c38d337a4aeb6600e5767feb',
        //          is_confirmed: true,
        //          is_outgoing: false,
        //          output_addresses: [Array],
        //          tokens: 10775,
        //          transaction: '020000000001.....' } ] }

        // TODO FIXME XXX: this could lead to an issue for many output transaction.
        // ie: if an attacker send 10 to user A at Galoy, and 10 to user B at galoy
        // in a sinle transaction, both would be credited 20.

        // FIXME O(n) ^ 2. bad.
        const matched_txs = incoming_txs
            .filter(tx => intersection(tx.output_addresses, onchain_addresses).length > 0)

        for (const matched_tx of matched_txs) {
            const mongotx = await Transaction.findOne({account_path: this.accountPathMedici, type: "onchain_receipt", hash: matched_tx.id})
            console.log({matched_tx, mongotx})
            if (!mongotx) {
                await MainBook.entry()
                    .credit('Assets:Reserve', matched_tx.tokens, {currency: "BTC", hash: matched_tx.id, type: "onchain_receipt" }) 
                    .debit(this.accountPath, matched_tx.tokens, {currency: "BTC", hash: matched_tx.id, type: "onchain_receipt" })
                    .commit()
            }
        }
    }

    async getInfo() {
        return await lnService.getWalletInfo({ lnd: this.lnd });
    }
}

export const getAuth = () => {
    try {
        // network = process.env.NETWORK // TODO
        const cert = process.env.TLS
        const macaroon = process.env.MACAROON 
            const macaroon = process.env.MACAROON 
        const macaroon = process.env.MACAROON 
        const lndip = process.env.LNDIP
        const socket = `${lndip}:10009`;
        if (!cert || !macaroon || !lndip) {
            throw new Error('TLS is not set')
        }
        return { macaroon, cert, socket };
    }
    catch (err) {
        throw Error(`failed-precondition: ${err}`);
    }
}

export class LightningWalletAuthed extends LightningUserWallet {
    constructor({uid}) {
        super({uid, auth: getAuth()});
    }
}