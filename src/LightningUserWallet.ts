import { IAddInvoiceRequest, ILightningTransaction, IPaymentRequest, TransactionType } from "./types";
import { shortenHash } from "./utils";
import { ILightningWallet } from "./interface";
import { Auth } from "./lightning";
const lnService = require('ln-service');
import * as functions from 'firebase-functions'
import { UserWallet } from "./wallet"
import { createInvoiceUser, createMainBook } from "./db";
const util = require('util')
import Timeout from 'await-timeout';
const mongoose = require("mongoose");


type IType = "invoice" | "payment" | "earn"

const formatInvoice = (type: IType, memo: String | undefined, pending: Boolean | undefined): String => {
  if (pending) {
    return `Waiting for payment`
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
        return "paid-invoice"
        // TODO
    }

    throw Error("incorrect type for formatType")
}


const formatPayment = (payment) => {
  if (payment.description) {
      return payment.description
  } else {
    return `Paid invoice ${shortenHash(payment.id, 2)}`
  }
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
        this.lnd = lnService.authenticatedLndGrpc(auth).lnd;
    }

    async getBalance() {
        await this.updatePendingInvoices()
        await this.updatePendingPayment()

        return super.getBalance()
    }

    protected async addHash({id, type}) {
        const InvoiceUser = await createInvoiceUser() 

        try {
            await new InvoiceUser({
                _id: id,
                type,
                uid: this.uid,
                pending: true, 
            }).save()
        } catch (err) {
            // TODO
            throw err
        }
    }

    async getTransactions(): Promise<Array<ILightningTransaction>> {

        await this.updatePendingInvoices()
        await this.updatePendingPayment()

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
            created_at: item.timestamp,
            amount: item.debit - item.credit,
            description: formatInvoice(item.type, item.memo, item.hash),
            hash: item.hash,
            // destination: TODO
            type: formatType(item.type, item.pending)
        }))

        return results_processed
    }

    async payInvoice({ invoice }) {
        const { id, tokens, destination, description } = await lnService.decodePaymentRequest({lnd: this.lnd, request: invoice})

        // TODO probe for payment first. 
        // like in `bos probe "payment_request/public_key"`
        // from https://github.com/alexbosworth/balanceofsatoshis

        const MainBook = await createMainBook()

        // TODO: continue only if user.balance > 0


        // TODO: handle on-us transaction
        console.log({destination})
        

        // probe for Route
        // TODO add private route from invoice
        const {route} = await lnService.probeForRoute({destination, lnd: this.lnd, tokens});
        console.log(util.inspect({route}, {showHidden: false, depth: null}))

        if (route.length === 0) {
            throw new functions.https.HttpsError('internal', `there is no route for this payment`)
        }

        // we are confident enough that there is a possible payment route. let's move forward

        try {
            // we associated the hash to the user.
            // and we used this table to known whether a payment is still pending
            await this.addHash({type: "payment", id})
        } catch (err) {
            // TODO manage is the user is trying to pay an invoice twice
            // { MongoError: E11000 duplicate key error collection ... }
            throw new functions.https.HttpsError('internal', err.message)
        }

        // reduce balance from customer first
        // TODO this should use a reference (using db transactions) from balance computed above
        // and fail is balance has changed in the meantime to prevent race condition
        
        const obj = {currency: this.currency, hash: id, type: "payment", pending: true}

        const entry = await MainBook.entry(description) 
        .debit('Assets:Reserve', tokens, obj)
        .credit(this.accountPath, tokens, obj)
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
                return {result: "pending"}
                // TODO processed in-flight payment in separate loop
            }

            console.log(typeof entry._id)

            try {
                await MainBook.void(entry._id, err[1])
                const Transaction = await mongoose.model("Medici_Transaction")
                await Transaction.updateMany({hash: id}, {pending: false, error: err[1]})
            } catch (err_db) {
                const err_message = `error canceling payment entry ${util.inspect({err_db})}`
                console.error(err_message)
                throw new functions.https.HttpsError('internal', err_message)
            }

            throw new functions.https.HttpsError('internal', `error paying invoice ${util.inspect({err})}`)
        }
        
        // success
        const Transaction = await mongoose.model("Medici_Transaction")
        await Transaction.updateMany({hash: id}, {pending: false})

        return {result: true}
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
                result = await lnService.getPayment({ lnd: this.lnd, id: payment.id })
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
                    await MainBook.void(payment._id, result.failed)
                    payment.pending = false
                    payment.save()
                } catch (err) {
                    throw new functions.https.HttpsError('internal', `error canceling payment entry ${util.inspect({err})}`)
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

        await this.addHash({type: "invoice", id})

        return request
    }

    // should be run regularly with a cronjob
    // TODO: move to an "admin/ops" wallet
    async updatePendingInvoices() {
    
        const MainBook = await createMainBook()

        const InvoiceUser = await createInvoiceUser()
        const hashArray = await InvoiceUser.find({user: this.uid, type: "invoice", pending: true})
            
        for (const hash of hashArray) {
            
            let result
            try {
                result = await lnService.getInvoice({ lnd: this.lnd, id: hash.id })
            } catch (err) {
                throw Error('issue fetching invoice: ' + err)
            }

            if (result.is_confirmed) {

                // TODO: use a transaction here
                // const session = await InvoiceUser.startSession()
                // session.withTransaction(
                
                // OR: use a an unique index account / hash / voided
                // may still not avoid issue from discrenpency between hash and the books

                try {
                    hash.pending = false
                    hash.save()

                    await MainBook.entry()
                    .credit('Assets:Reserve', result.tokens, {currency: "BTC", hash: hash.id, type: "invoice" }) 
                    .debit(this.accountPath, result.tokens, {currency: "BTC", hash: hash.id, type: "invoice" })
                    .commit()

                } catch (err) {
                    console.log(err)
                }

                // session.commitTransaction()
                // session.endSession()
            }
        }
    }

    /**
     * Advanced payment method to use keySend (new features from lnd 0.9)
     * Needs to be tested.
     * 
     * @param obj invoice detail
     */
    private async payDetail({pubkey, amount, message, hash, routes}: IPaymentRequest) {
        console.log({pubkey, amount, message, hash, routes})


        // TODO use validate()
        if (pubkey === undefined) {
            throw new functions.https.HttpsError('internal', `pubkey ${pubkey} in pay function`)
        }
    
        const {randomBytes, createHash} = require('crypto')
        const preimageByteLength = 32
        const preimage = randomBytes(preimageByteLength);
        const secret = preimage.toString('hex');
        const keySendPreimageType = '5482373484'; // key to use representing 'amount'
        const messageTmpId = '123123'; // random number, internal to Galoy for now
        
        // const hash = obj.hash 
        // TODO manage keysend case.
        // const hash = obj.hash ?? createHash('sha256').update(preimage).digest().toString('hex');
    
        const messages = [
            {type: keySendPreimageType, value: secret},
        ]
    
        if (message) {
            messages.push({
                type: messageTmpId, 
                value: Buffer.from(message).toString('hex'),
            })
        }
    
        const request = {
            id: hash,
            destination: pubkey,
            lnd: this.lnd,
            messages,
            tokens: amount,
            routes
        }
    
        // TODO manage self payment

        let result
        try {
            // TODO check what happens here for holdinvoice
            result = await lnService.payViaPaymentDetails(request)
            console.log(result)
        } catch (err) {
            console.log({err})
            throw new functions.https.HttpsError('internal', 'error paying invoice' + err.toString())
        }

        // TODO add fees for accounting based of result.fee
        // FIXME: maybe we shouldn't return all information from result?

        return result
    }

    async getInfo() {
        return await lnService.getWalletInfo({ lnd: this.lnd });
    }
}

export class LightningWalletAuthed extends LightningUserWallet {
    constructor({uid}) {
        let auth: Auth;
        let network: string;
        try {
            network = process.env.NETWORK ?? functions.config().lnd.network;
            const cert = process.env.TLS ?? functions.config().lnd[network].tls;
            const macaroon = process.env.MACAROON ?? functions.config().lnd[network].macaroon;
            const lndaddr = process.env.LNDADDR ?? functions.config().lnd[network].lndaddr;
            const socket = `${lndaddr}:10009`;
            auth = { macaroon, cert, socket };
        }
        catch (err) {
            throw new functions.https.HttpsError('failed-precondition', `neither env nor functions.config() are set` + err);
        }
        super({uid, auth});
    }
}
