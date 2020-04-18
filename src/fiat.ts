const functions = require("firebase-functions")
import * as admin from 'firebase-admin'
import { checkBankingEnabled, checkNonAnonymous, validate } from "./utils"
import moment = require("moment")
import { FiatTransaction } from "./interface"
const firestore = admin.firestore()


// TODO: User Class?

export const getFiatBalance = async (uid: string) => {
    const reduce = (txs: {amount: number}[]) => {
        const amounts = txs.map(tx => tx.amount)
        const reducer = (accumulator: number, currentValue: number) => accumulator + currentValue
        return amounts.reduce(reducer)
    }
    
    return firestore.doc(`/users/${uid}`).get().then(function(doc) {
        if (doc.exists && doc.data()!.transactions.length > 0) {
            return reduce(doc.data()!.transactions) // FIXME type
        } else {
            return 0 // no bank account yet
        }
    }).catch(err => {
        console.log('err', err) 
        return 0 // FIXME: currently error on reduce when there is no transactions
    })
}


// this could be run in the frontend?
exports.getFiatBalances = functions.https.onCall((data, context) => {
    checkBankingEnabled(context)

    return getFiatBalance(context.auth!.uid)
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

