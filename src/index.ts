import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin'
import { transactions_template } from "./const"
import { create, ApiResponse } from "apisauce"
import { sign, verify } from "./crypto"
const lnService = require('ln-service');
const validate = require("validate.js");
const assert = require('assert');


admin.initializeApp();
const firestore = admin.firestore()
 
interface Auth {
    macaroon: string,
    cert: string,
    socket: string,
}

// TODO, this should be shared with the mobile app
interface QuoteBackendInit {
    side: "buy" | "sell", 
    satPrice: number, 
    validUntil: number, 
    satAmount: number,
    address?: string,
}

interface QuoteBackendReceive {
    quote: QuoteBackendInit,
    btcAddress?: string, // buy
    onchain_tx?: string // sell
}

interface FiatTransaction {
    amount: number, 
    date: number,
    icon: string,
    name: string,
    onchain_tx: string, // should be HEX?
}

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
            return "No such document!"
        }
    }).catch(err => {
        console.log('err', err)
        return err
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
        throw Error("ref price server is down")
    }
    
    try {
        const sat_price: number = response.data.data.amount * Math.pow(10, -8)
        console.log(`sat spot price is ${sat_price}`)
        return sat_price
    } catch {
        throw Error("bad-data")
    }
}

exports.updatePrice = functions.pubsub.schedule('every 5 mins').onRun(async (context) => {
    try {
        const spot = await priceBTC()
        console.log(`updating price, new price: ${spot}`);
        await firestore.doc('global/price').set({BTC: spot})
    } catch (err) {
        return err
    }
});

// this could be run in the frontend?
exports.getFiatBalances = functions.https.onCall((data, context) => {
    if (context.auth === undefined) return 'no context'
    return getBalance(context.auth.uid)
})


exports.onUserWalletCreation = functions.https.onCall(async (data, context) => {
    if (context.auth === undefined) return 'no context'

    return firestore.doc(`/users/${context.auth.uid}`).update({
        lightning: {
            pubkey: data.pubkey,
            network: data.network,
            initTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        }
    }).then(writeResult => {
        return {result: `Transaction succesfully added ${writeResult}`}
    })
    .catch((err) => {
        console.error(err)
        return err
    })
})

exports.openChannel = functions.https.onCall(async (data, context) => {
    if (context.auth === undefined) return 'no context'

    const local_tokens = 20000;
    const lnd = initLnd()

    return firestore.doc(`/users/${context.auth.uid}`).get()
    .then(async doc => {
        if (doc.exists) {
            const pubkey = doc.data()!.lightning.pubkey
    
            // const isprivate = network === "mainnet"
            const isprivate = true

            const funding_tx = await lnService.openChannel({lnd, local_tokens, partner_public_key: pubkey, isprivate})
    
            return funding_tx
        } else {
            return 'missing document'
        }
    })
    .catch((err) => {
        console.error(err)
        return err
    })
})

const initLnd = () => {
    // TODO verify wallet is unlock?

    let auth_lnd: Auth
    let network: string
    
    try {
        network = process.env.network ?? functions.config().network
        const cert = process.env.TLS ?? functions.config().lnd[network].tls
        const macaroon = process.env.MACAROON ?? functions.config().lnd[network].macaroon
        const lndaddr = process.env.LNDADDR ?? functions.config().lnd[network].lndaddr
    
        const socket = `${lndaddr}:10009`
        auth_lnd = {macaroon, cert, socket}
    } catch (err) {
        throw new Error(`neither env nor functions.config() are set` + err)
    }

    console.log("lnd auth", auth_lnd)
    const {lnd} = lnService.authenticatedLndGrpc(auth_lnd);
    return lnd
}

exports.quoteBTC = functions.https.onCall(async (data, context) => {
    if (context.auth === undefined) return 'no context'

    const SPREAD = 0.015 //1.5%
    const QUOTE_VALIDITY = 30 * 1000

    const constraints = {
        satAmount: {
            presence: true,
            numericality: {
                onlyInteger: true,
                greaterThan: 0
        }},
        // side is from the customer side.
        // eg: buy side means customer is buying, we are selling.
        side: {
            inclusion: ["buy", "sell"]
        }
    }

    const err = validate(data, constraints)
    if (err !== undefined) {
        return err 
    }
    
    let spot
    
    try {
        spot = await priceBTC()
    } catch (err) {
        return err
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
    const validUntil = Date.now() + QUOTE_VALIDITY // 30 sec

    const message: QuoteBackendInit = {side, satPrice, validUntil, satAmount}  // FIXME type

    if (data.side === "sell") {
        const lnd = initLnd()
        const format = 'p2wpkh';
        const { address } = await lnService.createChainAddress({format, lnd});

        if (address === undefined) {
            throw new Error('error getting on chain address')
        }

        message.address = address
        await firestore.collection("sellquotes").doc(address).set({...message, uid: context.auth.uid})
        // TODO: cleanup quote that are older than 1 day?
    }

    // we sign the message to have stateless quote.
    // we could use a database of quote instead 
    // but we would need to recycle them once they expire
    // and this would also require multiple database call
    const signedMessage = await sign({... message})
    
    console.log(`${data.side} quote request from ${context.auth.uid}`)
    console.log(signedMessage)
    return signedMessage
})

const commonBuySell = ( data: QuoteBackendReceive,
                        now: number, 
                        context: functions.https.CallableContext) => {
    // TODO verify auth

    const constraints = {
        "satAmount": { 
            presence: true,
            numericality: {
                onlyInteger: true,
                greaterThan: 0
        }},
        "satPrice": { 
            numericality: {
                greaterThan: 0 // maybe only allow int?
        }},
        "signature": {
            presence: true, 
        },
        "validUntil": {
            presence: true,
            numericality: { // use datetime?
                onlyInteger: true,
                greaterThan: 0
        }}
    }

    const err = validate(data.quote, constraints)
    if (err !== undefined) {
        throw err // FIXME is err string or Error?
    }

    if (now >= data.quote.validUntil) {
        throw new Error('quote expired')
    }
    
    if (!verify(data.quote)) {
        throw new Error('signature is not valid')
    }
}

exports.buyBTC = functions.https.onCall(async (data: QuoteBackendReceive, context) => {
    if (context.auth === undefined) throw new Error('no context')
    
    const now = Date.now()    
    commonBuySell(data, now, context)

    const quote = data.quote

    // additional constraints just for buy
    const constraints = {
        btcAddress: {
            presence: {
               allowEmpty: false, // TODO: do proper address verification
    }}}

    const err = validate(data, constraints)
    if (err !== undefined) {
        throw err 
    }

    const fiatAmount = quote.satAmount  * quote.satPrice
    const remote_address = data.btcAddress

    if (await getBalance(context.auth.uid) < fiatAmount) {
        throw new Error('not enough fiat to proceed')
    }

    const lnd = initLnd()
    console.log(`lnd auth: ${lnd}`)

    console.log("lnd get onchain balance")
    const localBalance = (await lnService.getChainBalance({lnd})).chain_balance;
    if (localBalance < quote.satAmount ) {
        return 'sat balance too low to proceed'
    }

    const onchain_tx = await lnService.sendToChainAddress({address: remote_address, lnd, tokens: quote.satAmount })

    const fiat_tx: FiatTransaction = {
        amount: - fiatAmount, 
        date: now,
        icon: "logo-bitcoin",
        name: "Bought Bitcoin",
        onchain_tx: onchain_tx.id
    }

    const result = firestore.doc(`/users/${context.auth.uid}`).update({
        transactions: admin.firestore.FieldValue.arrayUnion(fiat_tx)
    })

    if (result) {
        return onchain_tx.id
    } else {
        return 'issue' //TODO
    }
})

exports.sellBTC = functions.https.onCall(async (data: QuoteBackendReceive, context) => {
    if (context.auth === undefined) throw new Error('no context')

    const now = Date.now()    
    commonBuySell(data, now, context)
    
    const quote = data.quote

    // additional constraints just for buy
    const constraints = {
        "quote.address": {
            presence: {
               allowEmpty: false, // TODO: do proper address verification
        }},
        onchain_tx: {
            presence: {
               allowEmpty: false, // TODO: do proper address verification
    }}}

    const err = validate(data, constraints)
    if (err !== undefined) {
        throw err 
    }

    await firestore.collection("sellquotes").doc(quote.address!).update({
        client_validation: true,
        client_onchain_tx: data.onchain_tx,
    })

    return 'success'

})

// TODO use onCall instead
exports.incomingTransaction = functions.https.onRequest(async (req, res) => {
    // TODO only authorize by admin-like
    // should just validate previous transaction

    // TODO: better UX can be done by taking consideration
    // for incoming transaction not yet mined, showing as "pending"

    const tx = req.body
    console.log(tx)

    // this should be a onchain transaction
    if (tx.is_confirmed && tx.is_outgoing === false) {
        const sellQuotes = firestore.collection("sellquotes");
        const querySnapshot = await sellQuotes.where("client_onchain_tx", "==", tx.id).get();
        
        assert(querySnapshot.size === 1)
        const doc_ref = querySnapshot.docs[0].ref

        const quote = querySnapshot.docs[0].data()

        assert (quote.client_onchain_tx === tx.id)

        if (quote.blockchain_validation) {
            return res.status(200).send({response: `transaction ${tx.id} already processed`});    
        }

        await doc_ref.update({
            blockchain_validation: true
        })

        const fiat_tx: FiatTransaction = {
            amount: quote.satAmount * quote.satPrice, // should be on satAmount taken from on chain
            date: Date.parse(tx.created_at),
            icon: "logo-bitcoin",
            name: "Sold Bitcoin",
            onchain_tx: tx.id
        }

        await firestore.doc(`/users/${quote.uid}`).update({
            transactions: admin.firestore.FieldValue.arrayUnion(fiat_tx)
        })
        
        return res.status(200).send({response: `transaction ${tx.id} updated succesfully`});
    }

    // manage other cases
    return res.status(404).send({response: 'nothing to do'})
});

exports.onUserCreation = functions.auth.user().onCreate((user) => {

    const randomTxs = transactions_template.filter((item) => Math.random() > 0.5 )

    return firestore.doc(`/users/${user.uid}`).set({transactions: randomTxs})
    .then(writeResult => {
        return {result: `Transaction succesfully added ${writeResult}`}
    })
    .catch((err) => {
        console.error(err)
        return err
    })
})


exports.setGlobalInfo = functions.https.onCall(async (data, context) => {
    const lnd = initLnd()
    const wallet = await lnService.getWalletInfo({lnd});

    return firestore.doc(`/global/info`).set({
        lightning: {
            uris: wallet.uris
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
    .catch(err => {return {err}})
})
