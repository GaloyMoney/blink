import { IAddInvoiceRequest, ILightningTransaction, IPaymentRequest, TransactionType } from "../../../../common/types";
import { shortenHash } from "../../../../common/utils";
import { ILightningWallet } from "./interface";
import { Auth } from "./lightning";
const lnService = require('ln-service');
import * as functions from 'firebase-functions'
import { Wallet } from "./wallet"
import { createHashUser, createMainBook } from "./db";
const util = require('util')
import Timeout from 'await-timeout';

const formatInvoice = (type: "invoice" | "payment", memo: String | undefined, pending: Boolean): String => {
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
      return type === "payment" ? `Payment sent` : `Payment received`
    }
  }
}

const formatType = (type: "invoice" | "payment", pending: Boolean): TransactionType | Error => {
    if (type === "invoice") {
        return pending ? "unconfirmed-invoice" : "paid-invoice"
    } 
    
    if (type === "payment") {
        return pending ? "inflight-payment" : "payment"
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
export class LightningWallet extends Wallet implements ILightningWallet {
    protected readonly lnd: object;
    protected _currency = "BTC"

    constructor({auth, uid}: {auth: Auth, uid: string}) {
        super({uid})
        this.lnd = lnService.authenticatedLndGrpc(auth).lnd;
    }

    protected async getHashes() {
        const HashUser = await createHashUser()
        // TODO: optimize query
        const invoiceUser = await HashUser.find({user: this.uid})
        return invoiceUser.filter(invoice => invoice.id)
    }

    protected async getHashesSet() {
        const invoiceArray = await this.getHashes()
        return new Set(invoiceArray.map(item => item.id))
    }

    protected async addHash({id, type}) {
        const HashUser = await createHashUser() 

        try {
            await new HashUser({
                _id: id,
                type,
                user: this.uid,
                pending: true, 
            }).save()
        } catch (err) {
            // TODO
            throw err
        }
    }

    async getTransactions(): Promise<Array<ILightningTransaction>> {
        // await this.getHashes()

        // const { payments } = await lnService.getPayments({ lnd: this.lnd })
        // const { invoices } = await lnService.getInvoices({ lnd: this.lnd })

        // const hashSet = await this.getHashesSet()

        // const paymentProcessed: Array<ILightningTransaction> = payments
        //     .filter(payment => hashSet.has(payment.id))
        //     .map(payment => ({
        //         amount: - payment.tokens,
        //         description: formatPayment(payment),
        //         created_at: payment.created_at,
        //         type: payment.is_confirmed !== undefined ? "payment" : "inflight-payment",
        //         hash: payment.id,
        //         destination: payment.destination,
        //     }))

        // const invoiceProcessed: Array<ILightningTransaction> = invoices
        //     .filter(invoice => hashSet.has(invoice.id))
        //     .map(invoice => ({
        //         amount: invoice.tokens,
        //         description: formatInvoice(invoice),
        //         created_at: invoice.created_at,

        //         // TODO manage inflight payment
        //         type: invoice.is_confirmed ? "paid-invoice" : "unconfirmed-invoice",
        //         hash: invoice.id,

        //         // FIXME is preimage useful for invoices?
        //         // I think for security reason we might not want to share it
        //         // ie: a customer could share the secret for a hold invoice, 
        //         // and the payment would not reach the destinataire but would 
        //         // still be out of the money
        //         // preimage: invoice.secret
        //         // note: blue wallet doesn't show the hash/preimage
        // }))
        
        // const all_txs = [...paymentProcessed, ...invoiceProcessed].sort(
        //     (a, b) => a.created_at > b.created_at ? -1 : 1
        // )
        
        // console.log({all_txs})
        // return all_txs

        const MainBook = await createMainBook()

        const { results } = await MainBook.ledger({
            account: this.customerPath,
            currency: this.currency,
            // start_date: startDate,
            // end_date: endDate
          }, ["hash"])
          // TODO we could duplicated pending/type to transaction,
          // this would avoid to fetch the data from hash collection and speed up query

        const results_processed = results.map((item) => ({
            created_at: item.timestamp,
            amount: item.debit - item.credit,
            description: formatInvoice(item.hash.type, item.memo, item.hash.pending),
            hash: item.hash.id,
            // destination: TODO
            type: formatType(item.hash.type, item.hash.pending)
        }))

        return results_processed
    }

    async payInvoice({ invoice }) {
        const { id, tokens, destination, description } = await lnService.decodePaymentRequest({lnd: this.lnd, request: invoice})

        // TODO probe for payment first. 
        // like in `bos probe "payment_request/public_key"`
        // from https://github.com/alexbosworth/balanceofsatoshis

        const MainBook = await createMainBook()
        const HashUser = await createHashUser()

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
        // TODO this should use a reference from balance computed above
        // and fail is balance has changed in the meantime to prevent race condition
        
        const entry = await MainBook.entry(description) 
        .debit('Assets:Reserve', tokens, {currency: this.currency, hash: id})
        .credit(this.customerPath, tokens, {currency: this.currency, hash: id})
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
                // TODO transaction
                await MainBook.void(entry._id, err[1])
                await HashUser.findOneAndUpdate({_id: id}, {pending: false, error: err[1]})
            } catch (err_db) {
                const err_message = `error canceling payment entry ${util.inspect({err_db})}`
                console.error(err_message)
                throw new functions.https.HttpsError('internal', err_message)
            }

            throw new functions.https.HttpsError('internal', `error paying invoice ${util.inspect({err})}`)
        }
        
        // success
        await HashUser.findOneAndUpdate({_id: id}, {pending: false})
        return {result: true}
    }
    
    // should be run regularly with a cronjob
    // TODO: move to an "admin/ops" wallet
    async updatePendingPayment() {
        
        const HashUser = await createHashUser()
        const hashArray = await HashUser.find({user: this.uid, type: "payment", pending: true})

        for (const hash of hashArray) {

            let result
            try {
                result = await lnService.getPayment({ lnd: this.lnd, id: hash.id })
            } catch (err) {
                throw Error('issue fetching payment: ' + err.toString())
            }

            if (result.is_confirmed) {
                // success
                await HashUser.findOneAndUpdate({_id: hash.id }, {pending: false})
            }

            if (result.is_failed) {
                try {
                    const MainBook = await createMainBook()
                    // TODO mongodb transaction
                    await MainBook.void(hash.id, result.failed)
                    await HashUser.findOneAndUpdate({_id: hash.id}, {pending: false, error: result.failed})
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

        return { request }
    }

    // should be run regularly with a cronjob
    // TODO: move to an "admin/ops" wallet
    async updatePendingInvoices() {
    
        const MainBook = await createMainBook()

        const HashUser = await createHashUser()
        const hashArray = await HashUser.find({user: this.uid, type: "invoice", pending: true})
            
        for (const hash of hashArray) {
            
            let result
            try {
                result = await lnService.getInvoice({ lnd: this.lnd, id: hash.id })
            } catch (err) {
                throw Error('issue fetching invoice: ' + err)
            }

            if (result.is_confirmed) {

                // TODO: use a transaction here
                // const session = await HashUser.startSession()
                // session.withTransaction(

                try {

                    await HashUser.findOneAndUpdate({_id: hash.id}, {pending: false})

                    await MainBook.entry('Invoice paid') // TODO replace by invoice memo
                    .credit('Assets:Reserve', result.tokens, {currency: "BTC", hash: hash.id }) 
                    .debit(this.customerPath, result.tokens, {currency: "BTC", hash: hash.id })
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

export class LightningWalletAuthed extends LightningWallet {
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
