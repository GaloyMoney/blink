import { IAddInvoiceRequest, ILightningTransaction, IPaymentRequest } from "../../../../common/types";
import { shortenHash } from "../../../../common/utils";
import { ILightningWallet, Wallet } from "./interface";
import { Auth } from "./lightning";
const lnService = require('ln-service');
import * as functions from 'firebase-functions'


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



/**
 * this represents a user wallet
 */
export class LightningWallet extends Wallet implements ILightningWallet {
    protected readonly lnd: object;
    
    constructor({auth, uid}: {auth: Auth, uid: string}) {
        super({uid})
        this.lnd = lnService.authenticatedLndGrpc(auth).lnd;
    }

    getCurrency() { return "BTC"; }
    async getBalance() {
        const balanceInChannels = (await lnService.getChannelBalance({ lnd: this.lnd })).channel_balance;
        return balanceInChannels;
    }

    async getTransactions(): Promise<Array<ILightningTransaction>> {
        const { payments } = await lnService.getPayments({ lnd: this.lnd })
        const { invoices } = await lnService.getInvoices({ lnd: this.lnd })

        const paymentProcessed: Array<ILightningTransaction> = payments.map(payment => ({
            amount: - payment.tokens,
            description: formatPayment(payment),
            created_at: payment.created_at,
            type: payment.is_confirmed !== undefined ? "payment" : "inflight-payment",
            hash: payment.id,
            preimage: payment.secret,
            destination: payment.destination,
        }))

        const invoiceProcessed: Array<ILightningTransaction> = invoices.map(invoice => ({
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
            // preimage: invoice.secret, 
        }))
        
        const all_txs = [...paymentProcessed, ...invoiceProcessed].sort(
            (a, b) => a.created_at > b.created_at ? -1 : 1
        )

        return all_txs
    }

    async payInvoice({ invoice }) {
        const details = lnService.decodePaymentRequest({lnd: this.lnd, request: invoice})

        return this.payDetail({
            pubkey: details.pubkey,
            hash: details.id,
            amount: details.tokens,
        })
    }
    
    async addInvoice({value, memo}: IAddInvoiceRequest) {
        const { request } = await lnService.createInvoice({
            lnd: this.lnd,
            tokens: value,
            description: memo,
        });
        return { request };
    }

    /**
     * Advanced payment method to use keySend (new features from lnd 0.9)
     * Needs to be tested.
     * 
     * @param obj invoice detail
     */
    async payDetail(obj: IPaymentRequest) {
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
    
        const hash = obj.hash ?? createHash('sha256').update(preimage).digest().toString('hex');
    
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
            result = await lnService.payViaPaymentDetails(request)
            console.log(result)
        } catch (err) {
            console.log({err})
            throw new functions.https.HttpsError('internal', 'error paying invoice' + err.toString())
        }
    
        return result
    }

    async getInfo() {
        return await lnService.getWalletInfo({ lnd: this.lnd });
    }
}

export class LightningWalletAuthed extends LightningWallet {
    constructor(uid) {
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
