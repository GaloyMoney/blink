import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
const firestore = admin.firestore()
const lnService = require('ln-service')


/**
 * @returns public key given uid  
 */
export const uidToPubkey = async (uid: string): Promise<string> => {
    try {
        const doc = await firestore.doc(`/users/${uid}`).get()
        const pubkey = doc.data()?.lightning?.pubkey

        if (pubkey === undefined) {
            throw new functions.https.HttpsError('not-found', `can't get pubkey for user ${uid}`)    
        }

        return pubkey
    } catch (err) {
        throw new functions.https.HttpsError('internal', `can't get pubkey for user ${uid}: error: ${err}`)
    }
}

/**
 * @returns uid given public key 
 */
export const pubkeyToUid = async (pubkey: string): Promise<string> => {
    const users = firestore.collection("users");
    const querySnapshot = await users.where("lightning.pubkey", "==", pubkey).get();
    
    if(querySnapshot.size === 0) {
        throw new functions.https.HttpsError('internal', `no UID associated with ${pubkey}`)
    }

    const userPath = querySnapshot.docs[0].ref.path
    const uid = userPath.split('/')[1]

    return uid
}

/**
 * @param lnd 
 * @param partner_public_key 
 * @returns array of channels
 */
export const channelsWithPubkey = async (lnd: any, partner_public_key: string): Promise<Array<Object>> => {
    // only send when first channel is being opened
    const { channels } = await lnService.getChannels({lnd})
    return channels.filter((item: any) => item.partner_public_key === partner_public_key)
}