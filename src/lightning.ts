import * as functions from 'firebase-functions'
import { IAddInvoiceRequest, IAddInvoiceResponse, IPayInvoice } from "../../../../common/types"
import { FiatTransaction } from "./interface"
import { checkAuth, checkNonAnonymous } from "./utils"
import { LightningWalletAuthed } from "./LightningUserWallet"
const lnService = require('ln-service')

export interface Auth {
    macaroon: string,
    cert: string,
    socket: string,
}

export const initLnd = () => {
    // TODO verify wallet is unlock?

    let auth_lnd: Auth
    let network: string
    
    try {
        network = process.env.NETWORK ?? functions.config().lnd.network
        const cert = process.env.TLS ?? functions.config().lnd[network].tls
        const macaroon = process.env.MACAROON ?? functions.config().lnd[network].macaroon
        const lndaddr = process.env.LNDADDR ?? functions.config().lnd[network].lndaddr
    
        const socket = `${lndaddr}:10009`
        auth_lnd = {macaroon, cert, socket}
    } catch (err) {
        throw new functions.https.HttpsError('failed-precondition', 
            `neither env nor functions.config() are set` + err)
    }

    // console.log("lnd auth", auth_lnd)
    const {lnd} = lnService.authenticatedLndGrpc(auth_lnd);
    return lnd
}

exports.addInvoice = functions.https.onCall(async (data: IAddInvoiceRequest, context): Promise<IAddInvoiceResponse> => {
    checkNonAnonymous(context)
    const wallet = new LightningWalletAuthed({uid: context.auth?.uid})
    return await wallet.addInvoice(data)
})

exports.getLightningInfo = functions.https.onCall(async (data, context) => {
    checkNonAnonymous(context)
    const wallet = new LightningWalletAuthed({uid: context.auth?.uid})
    return await wallet.getInfo()
})

exports.payInvoice = functions.https.onCall(async (data: IPayInvoice, context) => {
    checkNonAnonymous(context)
    const wallet = new LightningWalletAuthed({uid: context.auth?.uid})
    const response = await wallet.payInvoice({invoice: data.invoice})
    console.log({response})
    return response
})

exports.getLightningTransactions = functions.https.onCall(async (data, context) => {
    checkNonAnonymous(context)
    const wallet = new LightningWalletAuthed({uid: context.auth?.uid})
    const response = await wallet.getTransactions()
    return response
})

exports.getLightningBalance = functions.https.onCall(async (data, context) => {
    checkNonAnonymous(context)
    const wallet = new LightningWalletAuthed({uid: context.auth?.uid})
    const response = await wallet.getBalance()
    console.log({response})
    return response
})


// sellBTC
exports.incomingInvoice = functions.https.onRequest(async (req, res) => {
    // TODO only authorize by admin-like
    // should just validate previous transaction

    const lnd = initLnd()

    const invoice = req.body
    console.log(invoice)

    const request = invoice.request
    const channel = invoice.payments[0].in_channel // should it be htlcs[0] now?

    const invoiceJson = await lnService.decodePaymentRequest({lnd, request})

    // get a list of all the channels
    const { channels } = await lnService.getChannels({lnd})
    const channelJson = channels.filter((item: any) => item.id === channel)
    const partner_public_key = channelJson[0].partner_public_key

    // FIXME: 
    // remove firestore
    // move the logic for a custodial wallet

    // const users = firestore.collection("users");
    // const querySnapshot = await users.where("lightning.pubkey", "==", partner_public_key).get();
    // const uid = (querySnapshot.docs[0].ref as any)._path.segments[1] // FIXME use path?

    // const satAmount = invoiceJson.tokens
    // const satPrice = parseFloat(JSON.parse(invoiceJson.description)['satPrice'])
    // const fiatAmount = satAmount * satPrice

    // const fiat_tx: FiatTransaction = {
    //     amount: fiatAmount,
    //     date: Date.parse(invoiceJson.expires_at) / 1000,
    //     icon: "logo-bitcoin",
    //     name: "Sold Bitcoin",
    // }

    // await firestore.doc(`/users/${uid}`).update({
    //     transactions: admin.firestore.FieldValue.arrayUnion(fiat_tx)
    // })

    return res.status(200).send({response: `invoice ${request} accounted succesfully`});

})


// const giveEarn = async (uid: string, _stage: string[] | undefined = undefined) => {

//     const stage = _stage || (await firestore.doc(`users/${uid}/collection/stage`).get()).data()!.stage
    
//     // TODO rely on the invoice instead to know what is paid. need better invoice filtering.
//     const paid: string[] | undefined = (await firestore.doc(`users/${uid}/collection/paid`).get())?.data()?.stage as string[]
//     console.log('paid', paid)

//     // TODO move to loadash to clean this up. 
//     const toPay = stage?.filter((x:string) => !new Set(paid).has(x))
//     console.log('toPay', toPay)

//     const pubkey = await uidToPubkey(uid)

//     for (const item of toPay) {
//         const amount: number = (<any>OnboardingEarn)[item]
//         console.log(`trying to pay ${item} for ${amount}`)

//         try {
//             await pay({pubkey, amount, message: item})
//         } catch (err) {
//             throw new functions.https.HttpsError('internal', err.toString())
//         }

//         console.log(`paid earns ${item} to ${uid}`)

//         await firestore.doc(`/users/${uid}/collection/paid`).set({
//             stage: admin.firestore.FieldValue.arrayUnion(item)
//         }, { 
//             merge: true
//         })

//         console.log(`payment for ${item} stored in db`)
//     }
// }


// exports.onStageUpdated = functions.firestore
//     .document('users/{uid}/collection/stage')
//     .onWrite(async (change, context) => {

//         try {
//             const uid = context.params.uid
//             const { stage } = change.after.data() as any // FIXME type
//             console.log('stage', stage)
            
//             await giveEarn(uid, stage)

//         } catch (err) {
//             console.error(err)
//         }
// });


// exports.requestEarn = functions.https.onCall(async (data, context) => {
//     checkNonAnonymous(context)

//     await giveEarn(context.auth!.uid)

//     return {'result': 'success'}
// })


// TODO use onCall instead
exports.incomingOnChainTransaction = functions.https.onRequest(async (req, res) => {
    // TODO only authorize by admin-like
    // should just validate previous transaction

    // TODO: better UX can be done by taking consideration
    // for incoming transaction not yet mined, showing as "pending"

    const tx = req.body
    console.log(tx)

    return {'result': 'success'}
})