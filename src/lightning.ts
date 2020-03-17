import * as functions from 'firebase-functions'
const lnService = require('ln-service')


interface Auth {
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