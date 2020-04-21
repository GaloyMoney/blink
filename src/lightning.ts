import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { IAddInvoiceRequest, IAddInvoiceResponse, IPayInvoice } from "../../../../common/types"
import { FiatTransaction } from "./interface"
import { checkAuth, checkNonAnonymous } from "./utils"
import { LightningWalletAuthed } from "./LightningImpl"
const lnService = require('ln-service')
const firestore = admin.firestore()

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
    // checkAuth(context)
    const wallet = new LightningWalletAuthed()
    return await wallet.addInvoice(data)
})

exports.getLightningInfo = functions.https.onCall(async (data, context) => {
    // checkAuth(context)
    const wallet = new LightningWalletAuthed()
    return await wallet.getInfo()
})

exports.payInvoice = functions.https.onCall(async (data: IPayInvoice, context) => {
    checkAuth(context)

    const lnd = initLnd()

    const {response} = await lnService.payInvoice(
        {lnd, 
        request: data.invoice,
    });

    console.log({response})

    return {response}
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

    const users = firestore.collection("users");
    const querySnapshot = await users.where("lightning.pubkey", "==", partner_public_key).get();
    const uid = (querySnapshot.docs[0].ref as any)._path.segments[1] // FIXME use path?

    const satAmount = invoiceJson.tokens
    const satPrice = parseFloat(JSON.parse(invoiceJson.description)['satPrice'])
    const fiatAmount = satAmount * satPrice

    const fiat_tx: FiatTransaction = {
        amount: fiatAmount,
        date: Date.parse(invoiceJson.expires_at) / 1000,
        icon: "logo-bitcoin",
        name: "Sold Bitcoin",
    }

    await firestore.doc(`/users/${uid}`).update({
        transactions: admin.firestore.FieldValue.arrayUnion(fiat_tx)
    })

    return res.status(200).send({response: `invoice ${request} accounted succesfully`});

})

interface IPaymentRequest {
    pubkey?: string;
    amount?: number;
    message?: string;
    // or:
    invoice?: string
}

const pay = async (obj: IPaymentRequest) => {
    const {pubkey, amount, message} = obj

    if (pubkey === undefined) {
        throw new functions.https.HttpsError('internal', `pubkey ${pubkey} in pay function`)
    }

    const {randomBytes, createHash} = require('crypto')
    const preimageByteLength = 32
    const preimage = randomBytes(preimageByteLength);
    const secret = preimage.toString('hex');
    const keySendPreimageType = '5482373484'; // key to use representing 'amount'
    const messageTmpId = '123123'; // random number, internal to Galoy for now

    const id = createHash('sha256').update(preimage).digest().toString('hex');
    const lnd = initLnd()

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
        id,
        destination: pubkey,
        lnd,
        messages,
        tokens: amount,
    }

    let result
    try {
        result = await lnService.payViaPaymentDetails(request)
    } catch (err) {
        console.log({err})
    }

    console.log(result)
}


// const giveRewards = async (uid: string, _stage: string[] | undefined = undefined) => {

//     const stage = _stage || (await firestore.doc(`users/${uid}/collection/stage`).get()).data()!.stage
    
//     // TODO rely on the invoice instead to know what is paid. need better invoice filtering.
//     const paid: string[] | undefined = (await firestore.doc(`users/${uid}/collection/paid`).get())?.data()?.stage as string[]
//     console.log('paid', paid)

//     // TODO move to loadash to clean this up. 
//     const toPay = stage?.filter((x:string) => !new Set(paid).has(x))
//     console.log('toPay', toPay)

//     const pubkey = await uidToPubkey(uid)

//     for (const item of toPay) {
//         const amount: number = (<any>OnboardingRewards)[item]
//         console.log(`trying to pay ${item} for ${amount}`)

//         try {
//             await pay({pubkey, amount, message: item})
//         } catch (err) {
//             throw new functions.https.HttpsError('internal', err.toString())
//         }

//         console.log(`paid rewards ${item} to ${uid}`)

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
            
//             await giveRewards(uid, stage)

//         } catch (err) {
//             console.error(err)
//         }
// });


// exports.requestRewards = functions.https.onCall(async (data, context) => {
//     checkNonAnonymous(context)

//     await giveRewards(context.auth!.uid)

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