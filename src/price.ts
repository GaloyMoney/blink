import * as functions from 'firebase-functions'
import { sat2btc } from "./utils"
import * as admin from 'firebase-admin'
const firestore = admin.firestore()


/**
 * @returns  Price of SAT/USD
 */
export const priceBTC = async (): Promise<number> => {
  const ccxt = require ('ccxt')

  
  const kraken = new ccxt.kraken()
  // let coinbase = new ccxt.coinbase()
  // let bitfinex = new ccxt.bitfinex()
  
  let ticker

  try {
      ticker = await kraken.fetchTicker('BTC/USD')
  } catch (e) {
      // if the exception is thrown, it is "caught" and can be handled here
      // the handling reaction depends on the type of the exception
      // and on the purpose or business logic of your application
      if (e instanceof ccxt.NetworkError) {
          console.log ('fetchTicker failed due to a network error:', e.message)
          // retry or whatever
          // ...
      } else if (e instanceof ccxt.ExchangeError) {
          console.log ('fetchTicker failed due to exchange error:', e.message)
          // retry or whatever
          // ...
      } else {
          console.log ('fetchTicker failed with:', e.message)
          // retry or whatever
          // ...
      }
      throw new functions.https.HttpsError('resource-exhausted', "issue with ref exchanges")
  }

  try {
      const satPrice = sat2btc((ticker.ask + ticker.bid) / 2)
      console.log(`sat spot price is ${satPrice}`)
      return satPrice
  } catch {
      throw new functions.https.HttpsError('internal', "bad response from ref price server")
  }
}

exports.updatePrice = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
  try {
      const spot = await priceBTC()
      console.log(`updating price, new price: ${spot}`);
      await firestore.doc('global/price').set({BTC: spot})
  } catch (err) {
      throw new functions.https.HttpsError('internal', err.toString())
  }
})