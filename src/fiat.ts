
import * as admin from 'firebase-admin'
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
