import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'

// FIXME: figure out the way to do Just in time initializing with firebase
// Line below is needed before loading other file that may invoque admin.firestore()
// in the header
admin.initializeApp()
const firestore = admin.firestore()

import { transactions_template } from "./const"
import { sign, verify } from "./crypto"
import * as moment from 'moment'
import { IQuoteResponse, IQuoteRequest, IBuyRequest, OnboardingRewards } from "../../../../common/types"
import { getFiatBalance } from "./fiat"
import { channelsWithPubkey, uidToPubkey, pubkeyToUid } from "./utils"
import { priceBTC } from "./exchange"
import { initLnd } from "./lightning"
const validate = require("validate.js")
const lnService = require('ln-service')

interface FiatTransaction {
    amount: number, 
    date: number,
    icon: string,
    name: string,
    onchain_tx?: string, // should be HEX?
}

// we are extending validate so that we can validate dates
// which are not supported date by default
validate.extend(validate.validators.datetime, {
    // The value is guaranteed not to be null or undefined but otherwise it
    // could be anything.
    parse: function(value: any, options: any) {
        return +moment.utc(value);
    },
    // Input is a unix timestamp
    format: function(value: any, options: any) {
        const format = options.dateOnly ? "YYYY-MM-DD" : "YYYY-MM-DD hh:mm:ss";
        return moment.utc(value).format(format);
    }
})

exports.updatePrice = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
    try {
        const spot = await priceBTC()
        console.log(`updating price, new price: ${spot}`);
        await firestore.doc('global/price').set({BTC: spot})
    } catch (err) {
        throw new functions.https.HttpsError('internal', err.toString())
    }
})

const checkAuth = (context: any) => { // FIXME any
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 
            'The function must be called while authenticated.')
    }
}

const checkNonAnonymous = (context: any) => { // FIXME any
    checkAuth(context)

    if (context.auth.token.provider_id === "anonymous") {
        throw new functions.https.HttpsError('failed-precondition', 
            `This function must be while authenticate and not anonymous`)
    }
}

const checkBankingEnabled = checkNonAnonymous // TODO

// this could be run in the frontend?
exports.getFiatBalances = functions.https.onCall((data, context) => {
    checkBankingEnabled(context)

    return getFiatBalance(context.auth!.uid)
})

// for notification
exports.sendDeviceToken = functions.https.onCall(async (data, context) => {
    checkAuth(context)

    return firestore.doc(`/users/${context.auth!.uid}`).set({
        deviceToken: data.deviceToken}, { merge: true }
    ).then(writeResult => {
        return {result: `Transaction succesfully added ${writeResult}`}
    })
    .catch((err) => {
        console.error(err)
        throw new functions.https.HttpsError('internal', err)
    })
})


exports.quoteLNDBTC = functions.https.onCall(async (data: IQuoteRequest, context) => {
    checkBankingEnabled(context)

    const SPREAD = 0.015 //1.5%
    const QUOTE_VALIDITY = {seconds: 30}

    const constraints = {
        // side is from the customer side.
        // eg: buy side means customer is buying, we are selling.
        side: {
            inclusion: ["buy", "sell"]
        },
        invoice: function(value: any, attributes: any) {
            if (attributes.side === "sell") return null;
            return {
              presence: {message: "is required for buy order"},
              length: {minimum: 6} // what should be the minimum invoice length?
            };
        }, // we can derive satAmount for sell order with the invoice
        satAmount: function(value: any, attributes: any) {
            if (attributes.side === "buy") return null;
            return {
                presence: {message: "is required for sell order"},
                numericality: {
                    onlyInteger: true,
                    greaterThan: 0
            }}
    }}

    const err = validate(data, constraints)
    if (err !== undefined) {
        throw new functions.https.HttpsError('invalid-argument', JSON.stringify(err))
    }
    
    console.log(`${data.side} quote request from ${context.auth!.uid}, request: ${JSON.stringify(data, null, 4)}`)

    let spot
    
    try {
        spot = await priceBTC()
    } catch (err) {
        throw new functions.https.HttpsError('unavailable', err)
    }

    const satAmount = data.satAmount

    let multiplier = NaN

    if (data.side === "buy") {
        multiplier = 1 + SPREAD
    } else if (data.side === "sell") {
        multiplier = 1 - SPREAD
    }

    const side = data.side
    const satPrice = multiplier * spot
    const validUntil = moment().add(QUOTE_VALIDITY)

    const lnd = initLnd()

    const description = {
        satPrice,
        memo: "Sell BTC"
    }

    if (data.side === "sell") {
        const {request} = await lnService.createInvoice(
            {lnd, 
            tokens: satAmount,
            description: JSON.stringify(description),
            expires_at: validUntil.toISOString(),
        });

        if (request === undefined) {
            throw new functions.https.HttpsError('unavailable', 'error creating invoice')
        }

        return {side, invoice: request} as IQuoteResponse
        
    } else if (data.side === "buy") {

        const invoiceJson = await lnService.decodePaymentRequest({lnd, request: data.invoice})

        if (moment.utc() < moment.utc(invoiceJson.expires_at).subtract(QUOTE_VALIDITY)) { 
            throw new functions.https.HttpsError('failed-precondition', 'invoice expire within 30 seconds')
        }

        if (moment.utc() > moment.utc(invoiceJson.expires_at)) {
            throw new functions.https.HttpsError('failed-precondition', 'invoice already expired')
        }

        const message: IQuoteResponse = {
            side, 
            satPrice, 
            invoice: data.invoice!,
        }

        const signedMessage = await sign({... message})

        console.log(signedMessage)
        return signedMessage
    }

    return {'result': 'success'}
})


exports.buyLNDBTC = functions.https.onCall(async (data: IBuyRequest, context) => {
    checkBankingEnabled(context)

    const constraints = {
        side: {
            inclusion: ["buy"]
        },
        invoice: {
            presence: true,
            length: {minimum: 6} // what should be the minimum invoice length?
        },
        satPrice: {
            presence: true,
            numericality: {
                greaterThan: 0
        }},
        signature: {
            presence: true,
            length: {minimum: 6} // FIXME set correct signature length
        }
    }

    const err = validate(data, constraints)
    if (err !== undefined) {
        throw new functions.https.HttpsError('invalid-argument', JSON.stringify(err))
    }

    if (!verify(data)) {
        throw new functions.https.HttpsError('failed-precondition', 'signature is not valid')
    }

    const lnd = initLnd()
    const invoiceJson = await lnService.decodePaymentRequest({lnd, request: data.invoice})

    const satAmount = invoiceJson.tokens
    const destination = invoiceJson.destination

    const fiatAmount = satAmount * data.satPrice

    if (await getFiatBalance(context.auth!.uid) < fiatAmount) {
        throw new functions.https.HttpsError('permission-denied', 'not enough dollar to proceed')
    }

    const {route} = await lnService.probeForRoute({lnd, tokens: satAmount, destination})
    
    if (route?.length === 0) {
        throw new functions.https.HttpsError('internal', `Can't probe payment. Not enough liquidity?`)
    }

    const request = {lnd, ...invoiceJson}
    console.log({request})

    try {
        await lnService.payViaPaymentDetails(request) // TODO move to pay to unified payment to our light client
    } catch (err) {
        console.error(err)
        throw new functions.https.HttpsError('internal', `Error paying invoice ${err[0]}, ${err[1]}, ${err[2]?.details}`)
    }

    const fiat_tx: FiatTransaction = {
        amount: - fiatAmount, 
        date: moment().unix(),
        icon: "logo-bitcoin",
        name: "Bought Bitcoin",
        // onchain_tx: onchain_tx.id
    }

    try {
        const result = await firestore.doc(`/users/${context.auth!.uid}`).update({
            transactions: admin.firestore.FieldValue.arrayUnion(fiat_tx)
        })

        console.log(result)
    } catch(err) {
        throw new functions.https.HttpsError('internal', 'issue updating transaction on the database')
    }

    console.log("success")
    return {success: "success"}
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
        if (err[1] === 'FailedToFindPayableRouteToDestination') {
            // TODO: understand what trigger this error more specifically
    
            console.log(`no liquidity with pubkey ${pubkey}, opening new channel`)
            await openChannel(lnd, pubkey, amount);
        }
    }

    console.log(result)
}


const giveRewards = async (uid: string, _stage: string[] | undefined = undefined) => {

    const stage = _stage || (await firestore.doc(`users/${uid}/collection/stage`).get()).data()!.stage
    
    // TODO rely on the invoice instead to know what is paid. need better invoice filtering.
    const paid: string[] | undefined = (await firestore.doc(`users/${uid}/collection/paid`).get())?.data()?.stage as string[]
    console.log('paid', paid)

    // TODO move to loadash to clean this up. 
    const toPay = stage?.filter((x:string) => !new Set(paid).has(x))
    console.log('toPay', toPay)

    const pubkey = await uidToPubkey(uid)

    for (const item of toPay) {
        const amount: number = (<any>OnboardingRewards)[item]
        console.log(`trying to pay ${item} for ${amount}`)

        try {
            await pay({pubkey, amount, message: item})
        } catch (err) {
            throw new functions.https.HttpsError('internal', err.toString())
        }

        console.log(`paid rewards ${item} to ${uid}`)

        await firestore.doc(`/users/${uid}/collection/paid`).set({
            stage: admin.firestore.FieldValue.arrayUnion(item)
        }, { 
            merge: true
        })

        console.log(`payment for ${item} stored in db`)
    }
}

exports.onStageUpdated = functions.firestore
    .document('users/{uid}/collection/stage')
    .onWrite(async (change, context) => {

        try {
            const uid = context.params.uid
            const { stage } = change.after.data() as any // FIXME type
            console.log('stage', stage)
            
            await giveRewards(uid, stage)

        } catch (err) {
            console.error(err)
        }
});


exports.requestRewards = functions.https.onCall(async (data, context) => {
    checkNonAnonymous(context)

    await giveRewards(context.auth!.uid)

    return {'result': 'success'}
})

exports.dollarFaucet = functions.https.onCall(async (data, context) => {
    checkBankingEnabled(context)

    const fiat_tx: FiatTransaction = {
        amount: data.amount,
        date: moment().unix(),
        icon: "ios-print",
        name: "Dollar Faucet",
    }

    await firestore.doc(`/users/${context.auth!.uid}`).update({
        transactions: admin.firestore.FieldValue.arrayUnion(fiat_tx)
    })
})

exports.onBankAccountOpening = functions.https.onCall(async (data, context) => {
    checkNonAnonymous(context)

    const constraints = {
        dateOfBirth: {
            datetime: true,
            // latest: moment.utc().subtract(18, 'years'),
            // message: "^You need to be at least 18 years old"
        },
        firstName: {
            presence: true, 
        },
        lastName: {
            presence: true, 
        },
        email: {
            email: true
        },
    }

    {
        const err = validate(data, constraints)
        if (err !== undefined) {
            console.log(err)
            throw new functions.https.HttpsError('invalid-argument', JSON.stringify(err))
        }
    }

    return firestore.doc(`/users/${context.auth!.uid}`).set({ userInfo: data }, { merge: true }
    ).then(writeResult => {
        return {result: `Transaction succesfully added ${writeResult}`}
    })
    .catch((err) => {
        console.error(err)
        throw new functions.https.HttpsError('internal', err.toString())
    })

})


// TODO use onCall instead
exports.incomingOnChainTransaction = functions.https.onRequest(async (req, res) => {
    // TODO only authorize by admin-like
    // should just validate previous transaction

    // TODO: better UX can be done by taking consideration
    // for incoming transaction not yet mined, showing as "pending"

    const tx = req.body
    console.log(tx)

    return {'result': 'success'}
});



// await sendText({
//     to: phoneNumber,
//     body: `Your wallet is ready! open your galoy://app to get and spend your micro reward`
// })


exports.onUserCreation = functions.auth.user().onCreate(async (user) => {
    //TODO clean up returns

    const prepopulate = false
    const lookup = false

    let transactions: any[] // FIXME

    if (prepopulate) {
        transactions = transactions_template.filter((item) => Math.random() > 0.5 )
    } else {
        transactions = []
    }

    try {
        const result = await firestore.doc(`/users/${user.uid}`).set(
            { transactions },
            { merge: true }
        )
        console.log(`Transaction succesfully added ${result}`)
    } catch (err) {
        console.error(err)
        throw new functions.https.HttpsError('internal', err)
    }

    if (lookup) {

        const { getTwilioClient } = require("./text")

        const phoneNumber = (await admin.auth().getUser(user.uid)).phoneNumber
        console.log(phoneNumber)

        const callerInfo = await getTwilioClient().lookups.phoneNumbers(phoneNumber)
                                .fetch({type: ['caller-name', 'carrier']})

        const twilio = JSON.parse(JSON.stringify(callerInfo)) // FIXME hacky?

        return firestore.doc(`/users/${user.uid}`).set({ twilio }, { merge: true }
        ).then(writeResult => {
            return {result: `Transaction succesfully added ${writeResult}`}
        })
        .catch((err) => {
            console.error(err)
            throw new functions.https.HttpsError('internal', err)
        })
    }

    return {'result': 'success'}
})

exports.test = functions.https.onCall(async (data, context) => {
    console.log(context)
})

exports.setGlobalInfo = functions.https.onCall(async (data, context) => {
    const lnd = initLnd()
    const wallet = await lnService.getWalletInfo({lnd});

    return firestore.doc(`/global/info`).set({
        lightning: {
            pubkey: wallet.public_key,
            host: functions.config().lnd[functions.config().lnd.network].lndaddr
    }})
})

exports.deleteCurrentUser = functions.https.onCall(async (data, context) => {
    try {
        await admin.auth().deleteUser(context.auth!.uid)
        return {'result': 'success'}
    } catch(err) {
        throw new functions.https.HttpsError('internal', err)
    }
})

exports.deleteAllUsers = functions.https.onCall(async (data, context) => {
    return admin.auth().listUsers()
    .then(listUsers => {
        for (const user of listUsers.users) {
            admin.auth().deleteUser(user.uid)
            .catch(err => err)
        }

        const collectionDeleted = deleteCollection(firestore, 'users', 50)
        
        return {userDeleted: listUsers.users, collectionDeleted}
    })
    .catch(err => {
        throw new functions.https.HttpsError('internal', err)
    })
})

const deleteCollection = async (db: any, collectionPath: any, batchSize: any) => {
    let collectionRef = db.collection(collectionPath);
    let query = collectionRef.orderBy('__name__').limit(batchSize);
  
    return new Promise((resolve, reject) => {
      deleteQueryBatch(db, query, batchSize, resolve, reject);
    });
  }
  
function deleteQueryBatch(db: any, query: any, batchSize: any, resolve: any, reject: any) {
    query.get()
    .then((snapshot: any) => {
    // When there are no documents left, we are done
    if (snapshot.size == 0) {
        return 0;
    }

    // Delete documents in a batch
    let batch = db.batch();
    snapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
    });

    return batch.commit().then(() => {
        return snapshot.size;
    });
    }).then((numDeleted: any) => {
    if (numDeleted === 0) {
        resolve();
        return;
    }

    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
        deleteQueryBatch(db, query, batchSize, resolve, reject);
    });
    })
    .catch(reject);
}
