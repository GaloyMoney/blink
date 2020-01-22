import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { transactions_template } from "./const"
import { create, ApiResponse } from "apisauce"
import { sign, verify } from "./crypto"
import * as moment from 'moment'
import { IQuoteResponse, IQuoteRequest, IBuyRequest } from "./type"
const lnService = require('ln-service')
const validate = require("validate.js")
const assert = require('assert')

interface Auth {
    macaroon: string,
    cert: string,
    socket: string,
}

interface FiatTransaction {
    amount: number, 
    date: number,
    icon: string,
    name: string,
    onchain_tx?: string, // should be HEX?
}


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
});



admin.initializeApp();
const firestore = admin.firestore()


const getBalance = async (uid: string) => {
    const reduce = (txs: {amount: number}[]) => {
        const amounts = txs.map(tx => tx.amount)
        const reducer = (accumulator: number, currentValue: number) => accumulator + currentValue
        return amounts.reduce(reducer)
    }
    
    return firestore.doc(`/users/${uid}`).get().then(function(doc) {
        if (doc.exists) {
            return reduce(doc.data()!.transactions) // FIXME type
        } else {
            return 0 // no bank account yet
        }
    }).catch(err => {
        console.log('err', err)
        throw new functions.https.HttpsError('internal', `issue with fetching balance ${err}`)
    })
}

/**
 * @returns      Price of BTC in sat.
 */
const priceBTC = async (): Promise<number> => {
    const COINBASE_API= 'https://api.coinbase.com/'
    const TIMEOUT= 5000
    
    const apisauce = create({
        baseURL: COINBASE_API,
        timeout: TIMEOUT,
        headers: { Accept: "application/json" },
    })
      
    const response: ApiResponse<any> = await apisauce.get(`/v2/prices/spot?currency=USD`)
    
    if (!response.ok) {
        throw new functions.https.HttpsError('resource-exhausted', "ref price server is down")
    }
    
    try {
        const sat_price: number = response.data.data.amount * Math.pow(10, -8)
        console.log(`sat spot price is ${sat_price}`)
        return sat_price
    } catch {
        throw new functions.https.HttpsError('internal', "bad response from ref price server")
    }
}

exports.updatePrice = functions.pubsub.schedule('every 15 mins').onRun(async (context) => {
    try {
        const spot = await priceBTC()
        console.log(`updating price, new price: ${spot}`);
        await firestore.doc('global/price').set({BTC: spot})
    } catch (err) {
        throw new functions.https.HttpsError('internal', err.toString())
    }
});

// this could be run in the frontend?
exports.getFiatBalances = functions.https.onCall((data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 
            'The function must be called while authenticated.')};

    return getBalance(context.auth.uid)
})


exports.sendPubKey = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 
            'The function must be called while authenticated.')};

    const constraints = {
        pubkey: {
            length: {is: 66} // why 66 and not 64?
        },
        network: {
            inclusion: {
                within: {"testnet": "mainnet"}
        }}
    }

    {
        const err = validate(data, constraints)
        if (err !== undefined) {
            throw new functions.https.HttpsError('invalid-argument', JSON.stringify(err))
        }
    }

    return firestore.doc(`/users/${context.auth.uid}`).set({
        lightning: {
            pubkey: data.pubkey,
            network: data.network,
            initTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        }}, { merge: true }
    ).then(writeResult => {
        return {result: `Transaction succesfully added ${writeResult}`}
    })
    .catch((err) => {
        console.error(err)
        throw new functions.https.HttpsError('internal', err)
    })
})

exports.sendDeviceToken = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 
            'The function must be called while authenticated.')};

    return firestore.doc(`/users/${context.auth.uid}`).set({
        deviceToken: data.deviceToken}, { merge: true }
    ).then(writeResult => {
        return {result: `Transaction succesfully added ${writeResult}`}
    })
    .catch((err) => {
        console.error(err)
        throw new functions.https.HttpsError('internal', err)
    })
})

exports.openChannel = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 
            'The function must be called while authenticated.')};

    const local_tokens = 120000;
    const lnd = initLnd()

    return firestore.doc(`/users/${context.auth.uid}`).get()
    .then(async doc => {
        if (!doc.exists) {
            throw new functions.https.HttpsError('not-found', 
            `Can't find associated user`);
        }

        const pubkey = doc.data()!.lightning.pubkey
        const is_private = true
        const funding_tx = await lnService.openChannel({lnd, local_tokens, partner_public_key: pubkey, is_private})

        return {funding_tx}
    })
    .catch((err) => {
        console.error(err)
        let message = `${err[0]}, ${err[1]}, `
        message += err[2] ? err[2].details : '' // FIXME verify details it the property we want
        throw new functions.https.HttpsError('internal', message)
    })
})

const initLnd = () => {
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

const twilioPhoneNumber = "***REMOVED***"
const getTwilioClient = () => {
    const accountSID = "***REMOVED***"
    const authToken = "***REMOVED***"
    
    const client = require('twilio')(
        accountSID,
        authToken
    );

    return client
}

exports.quoteLNDBTC = functions.https.onCall(async (data: IQuoteRequest, context) => {
    console.log('executing quoteLNDBTC')

    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 
            'The function must be called while authenticated.')};

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
    
    console.log(`${data.side} quote request from ${context.auth.uid}, request: ${data}`)

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

    if (data.side === "sell") {
        const {request} = await lnService.createInvoice(
            {lnd, 
            tokens: satAmount,
            description: `satPrice:${satPrice}`,
            expires_at: validUntil.toISOString(),
        });

        if (request === undefined) {
            throw new functions.https.HttpsError('unavailable', 'error creating invoice')
        }

        return {side, invoice: request} as IQuoteResponse
        
    } else if (data.side === "buy") {

        const invoiceJson = await lnService.decodePaymentRequest({lnd, request: data.invoice})

        if (moment.utc() < moment.utc(invoiceJson.expires_at).subtract(QUOTE_VALIDITY)) { 
            throw new functions.https.HttpsError('failed-precondition', 'invoice should expiry within 30 seconds')
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

    return true
})


exports.buyLNDBTC = functions.https.onCall(async (data: IBuyRequest, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 
            'The function must be called while authenticated.')};

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

    if (await getBalance(context.auth.uid) < fiatAmount) {
        throw new functions.https.HttpsError('permission-denied', 'not enough dollar to proceed')
    }

    const {route} = await lnService.probeForRoute({lnd, tokens: satAmount, destination})
    
    if (route?.length === 0) {
        throw new functions.https.HttpsError('internal', `Can't probe payment. Not enough liquidity?`)
    }

    try {
        await lnService.pay({lnd, request: data.invoice})
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
        const result = await firestore.doc(`/users/${context.auth.uid}`).update({
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
    const channel = invoice.payments[0].in_channel

    const invoiceJson = await lnService.decodePaymentRequest({lnd, request})

    const { channels } = await lnService.getChannels({lnd})
    const channelJson = channels.filter((item: any) => item.id === channel)
    const partner_public_key = channelJson[0].partner_public_key

    const users = firestore.collection("users");
    const querySnapshot = await users.where("lightning.pubkey", "==", partner_public_key).get();
    const uid = (querySnapshot.docs[0].ref as any)._path.segments[1] // FIXME use path?

    const satAmount = invoiceJson.tokens
    const satPrice = parseFloat(invoiceJson.description.split(":")[1])
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

exports.payInvoice = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 
            'The function must be called while authenticated.')};

    // FIXME unsecure

    const lnd = initLnd()

    const invoice = data.invoice
    console.log(`invoice: ${invoice}`)

    try {
        const result = await lnService.pay({lnd, request: invoice})
        console.log(result)
        return 'success'
    } catch (err) {
        console.log(err)
        return Promise.reject(new functions.https.HttpsError(
            'internal', 
            `${err[0]}, ${err[1]}, ${err[2].message}` ));
    }
})

exports.onBankAccountOpening = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 
            'The function must be called while authenticated.')};

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

    return firestore.doc(`/users/${context.auth.uid}`).set({ userInfo: data }, { merge: true }
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

});

// TODO use onCall instead
exports.incomingChannel = functions.https.onRequest(async (req, res) => {
    // TODO only authorize by admin-like
    // should just validate previous transaction

    const channel = req.body
    console.log(channel)


    const users = firestore.collection("users");
    const querySnapshot = await users.where("lightning.pubkey", "==", channel.partner_public_key).get();
    
    assert(querySnapshot.size === 1)

    const userPath = querySnapshot.docs[0].ref.path
    const uid = userPath.split('/')[1]

    console.log(uid)

    const phoneNumber = (await admin.auth().getUser(uid)).phoneNumber

    if (phoneNumber === undefined) {
        return { success: false, reason: 'phone number undefined' };
    }

    console.log(`sending message to ${phoneNumber} for channel creation`)
    
    try {
        await getTwilioClient().messages.create({
            from: twilioPhoneNumber,
            to: phoneNumber,
            body: `Your channel is ready! open your galoy://app to get and spend your micro reward`
        })
    } catch (err) {
        console.error(`impossible to send twilio request`, err)
        return { success: false };
    }

    return res.status(200).send({response: 'ok', phoneNumber})
})


// exports.haveHodlInvoice = functions.pubsub.schedule('every 1 mins').onRun(async (context) => {

//     const lnd = initLnd()

//     const { channels } = await lnService.getChannels({lnd})

//     const found = channels.find((item:any) => {return item.pending_payments.length > 0});
//     console.log(found)

    // return result

    // {
    //     "partner_public_key": "0361925516266d7bbc17c1af086aaf1d5f25d584ee4d2b1187d9ab57a3aa48e288",
    //     "pending_payments": [
    //         {
    //             "is_outgoing": false,
    //             "tokens": "1",
    //             "id": "PzMYKCclCidisQzDyk0sJoHTwRlIW4WQDheck8Wnyts=",
    //             "timeout": 376
    //         }
    //     ],
    // }

// })

exports.onUserCreation = functions.auth.user().onCreate(async (user) => {
    //TODO clean up returns

    const prepopulate = false
    const lookup = true

    let transactions: any[] // FIXME

    if (prepopulate) {
        transactions = transactions_template.filter((item) => Math.random() > 0.5 )
    } else {
        transactions = []
    }

    try {
        const result = await firestore.doc(`/users/${user.uid}`).set({transactions})
        console.log(`Transaction succesfully added ${result}`)
    } catch (err) {
        console.error(err)
        throw new functions.https.HttpsError('internal', err)
    }

    if (lookup) {

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

    return true
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

exports.deleteAllUsers = functions.https.onCall(async (data, context) => {
    return admin.auth().listUsers()
    .then(listUsers => {
        for (const user of listUsers.users) {
            admin.auth().deleteUser(user.uid)
            .catch(err => err)
        }

        return {userDeleted: listUsers.users}
    })
    .catch(err => {
        throw new functions.https.HttpsError('internal', err)
    })
})
