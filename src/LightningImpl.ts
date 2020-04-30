import { IAddInvoiceRequest, ILightningTransaction, IPaymentRequest } from "../../../../common/types";
import { shortenHash } from "../../../../common/utils";
import { ILightningWallet } from "./interface";
import { Auth } from "./lightning";
const lnService = require('ln-service');
import * as functions from 'firebase-functions'
import { Wallet } from "./wallet"
import { createHashUser } from "./db";

const formatInvoice = (invoice) => {
  if (invoice.settled) {
    if (invoice.memo) {
      return invoice.memo
    } else if (invoice.htlcs[0].customRecords) {
      // TODO for lnd keysend 
    } else {
      return `Payment received`
    }
  } else {
    return `Waiting for payment`
  }
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
    
    constructor({auth, uid}: {auth: Auth, uid: string}) {
        super({uid})
        this.lnd = lnService.authenticatedLndGrpc(auth).lnd;
    }

    protected async getHashes() {
        const HashUser = await createHashUser()
        // TODO: optimize query
        const invoiceUser = await HashUser.find({user: this.uid})
        return invoiceUser.map(invoice => invoice.id)
    }

    protected async getHashesSet() {
        const invoiceArray = await this.getHashes()
        return new Set(invoiceArray)
    }

    protected async addHash({id, type}) {
        const HashUser = await createHashUser() 

        try {
            await new HashUser({
                _id: id,
                type,
                user: this.uid,
            }).save()
        } catch (err) {
            // TODO
            throw err
        }
    }

    getCurrency() { return "BTC"; }
    
    async getBalance() {

        let balance = 0

        const hashSet = await this.getHashes()
        for (const hash of hashSet) {
            if (hash.type === "invoice") {
                const invoice = lnService.getInvoice({lnd: this.lnd, id: hash.id})
                if (invoice.is_confirmed) {
                    balance += invoice.tokens
                    continue
                }
            } else if (hash.type === "payment") {
                const payment = lnService.getPayment({lnd: this.lnd, id: hash.id})
                if (payment.is_failed) {
                    continue
                } else if (payment.is_pending) {
                    balance -= payment.tokens
                    // TODO used unconfirmed balance
                } else if (payment.is_confirmed) {
                    balance -= payment.tokens
                } else {
                    throw Error("weird payment case")
                }
            }
        }

        return balance
    }

    async getTransactions(): Promise<Array<ILightningTransaction>> {
        const { payments } = await lnService.getPayments({ lnd: this.lnd })
        const { invoices } = await lnService.getInvoices({ lnd: this.lnd })

        const hashSet = await this.getHashesSet()

        const paymentProcessed: Array<ILightningTransaction> = payments
            .filter(payment => hashSet.has(payment.id))
            .map(payment => ({
                amount: - payment.tokens,
                description: formatPayment(payment),
                created_at: payment.created_at,
                type: payment.is_confirmed !== undefined ? "payment" : "inflight-payment",
                hash: payment.id,
                preimage: payment.secret,
                destination: payment.destination,
            }))

        const invoiceProcessed: Array<ILightningTransaction> = invoices
            .filter(invoice => hashSet.has(invoice.id))
            .map(invoice => ({
                amount: invoice.tokens,
                description: formatInvoice(invoice),
                created_at: invoice.created_at,

                // TODO manage inflight payment
                type: invoice.confirmed !== undefined ? "paid-invoice" : "unconfirmed-invoice",
                hash: invoice.id,

                // FIXME is preimage useful for invoices?
                // I think for security reason we might not want to share it
                // ie: a customer could share the secret for a hold invoice, 
                // and the payment would not reach the destinataire but would 
                // still be out of the money
                // preimage: invoice.secret
                // note: blue wallet doesn't show the hash/preimage
        }))
        
        const all_txs = [...paymentProcessed, ...invoiceProcessed].sort(
            (a, b) => a.created_at > b.created_at ? -1 : 1
        )

        return all_txs
    }

    async payInvoice({ invoice }) {
        const details = await lnService.decodePaymentRequest({lnd: this.lnd, request: invoice})

        await this.addHash({type: "payment", id: details.id})

        return this.payDetail({
            pubkey: details.destination,
            hash: details.id,
            amount: details.tokens,
        })
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

    /**
     * Advanced payment method to use keySend (new features from lnd 0.9)
     * Needs to be tested.
     * 
     * @param obj invoice detail
     */
    private async payDetail(obj: IPaymentRequest) {
        const {pubkey, amount, message} = obj

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
        
        const hash = obj.hash 
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
