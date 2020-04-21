import { IAddInvoiceRequest } from "../../../../common/types";
import { ILightningWallet } from "./interface";
import { Auth } from "./lightning";
const lnService = require('ln-service');
import * as functions from 'firebase-functions'


interface IPaymentRequest {
    pubkey: string;
    amount: number;
    message?: string;
    hash?: string;
}


export class LightningWallet implements ILightningWallet {
    protected lnd: object;
    constructor(auth: Auth) {
        this.lnd = lnService.authenticatedLndGrpc(auth).lnd;
    }
    getCurrency() { return "BTC"; }
    async getBalance() {
        const balanceInChannels = (await lnService.getChannelBalance({ lnd: this.lnd })).channel_balance;
        return balanceInChannels;
    }

    async getTransactions() {
        const { payments } = await lnService.getPayments({ lnd: this.lnd });
        const { invoices } = await lnService.getInvoices({ lnd: this.lnd });
        console.log({ payments, invoices });
        // TODO
    }

    async payInvoice({ invoice }) {
        const details = lnService.decodePaymentRequest({lnd: this.lnd, request: invoice})

        return this.payDetail({
            pubkey: details.pubkey,
            hash: details.id,
            amount: details.tokens,
        })
    }
    
    async addInvoice(invoiceRequest: IAddInvoiceRequest) {
        const { request } = await lnService.createInvoice({
            lnd: this.lnd,
            tokens: invoiceRequest.value,
            description: invoiceRequest.memo,
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
    constructor() {
        let auth_lnd: Auth;
        let network: string;
        try {
            network = process.env.NETWORK ?? functions.config().lnd.network;
            const cert = process.env.TLS ?? functions.config().lnd[network].tls;
            const macaroon = process.env.MACAROON ?? functions.config().lnd[network].macaroon;
            const lndaddr = process.env.LNDADDR ?? functions.config().lnd[network].lndaddr;
            const socket = `${lndaddr}:10009`;
            auth_lnd = { macaroon, cert, socket };
        }
        catch (err) {
            throw new functions.https.HttpsError('failed-precondition', `neither env nor functions.config() are set` + err);
        }
        super(auth_lnd);
    }
}
