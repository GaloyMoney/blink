import { IAddInvoiceRequest } from "../../../../common/types";
import { ILightningWallet } from "./interface";
import { Auth } from "./lightning";
const lnService = require('ln-service');
import * as functions from 'firebase-functions'

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
        const { response } = await lnService.pay({
            lnd: this.lnd,
            request: invoice,
        });
        return { response };
    }
    async addInvoice(invoiceRequest: IAddInvoiceRequest) {
        const { request } = await lnService.createInvoice({
            lnd: this.lnd,
            tokens: invoiceRequest.value,
            description: invoiceRequest.memo,
        });
        return { request };
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
