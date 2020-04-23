const functions = require("firebase-functions")
import { checkBankingEnabled, checkNonAnonymous } from "./utils"
import { FiatWallet } from "./fiatImpl"

const default_uid = "abcdef" // FIXME

exports.getFiatBalances = functions.https.onCall((data, context) => {
    // checkBankingEnabled(context)
    const fiatWallet = new FiatWallet({uid: default_uid})
    return fiatWallet.getBalance()
})

exports.dollarFaucet = functions.https.onCall(async (data, context) => {
    // checkBankingEnabled(context)
    const fiatWallet = new FiatWallet({uid: default_uid})
    return fiatWallet.addFunds({amount: 1000})
})

exports.onBankAccountOpening = functions.https.onCall(async (data, context) => {
    checkNonAnonymous(context)
    checkBankingEnabled(context)

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

    // {
    //     const err = validate(data, constraints)
    //     if (err !== undefined) {
    //         console.log(err)
    //         throw new functions.https.HttpsError('invalid-argument', JSON.stringify(err))
    //     }
    // }

    // return firestore.doc(`/users/${context.auth!.uid}`).set({ userInfo: data }, { merge: true }
    // ).then(writeResult => {
    //     return {result: `Transaction succesfully added ${writeResult}`}
    // })
    // .catch((err) => {
    //     console.error(err)
    //     throw new functions.https.HttpsError('internal', err.toString())
    // })

})

