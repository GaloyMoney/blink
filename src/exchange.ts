import { create, ApiResponse } from "apisauce"
import * as functions from 'firebase-functions'


/**
 * @returns      Price of BTC in sat.
 */
export const priceBTC = async (): Promise<number> => {
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

