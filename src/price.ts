import * as functions from 'firebase-functions'
import { Price } from "./priceImpl"
import { checkAuth } from "./utils"

exports.updatePrice = functions.pubsub.schedule('every 10 minutes').onRun(async (context) => {
    const price = new Price()
    await price.update()
})

exports.manualUpdatePrice = functions.https.onCall(async (data, context) => {
    const price = new Price()
    await price.update()
})

exports.getPrice = functions.https.onCall(async (data, context) => {
    checkAuth(context)
    const price = new Price()
    const response = await price.lastCached()
    return response
})
