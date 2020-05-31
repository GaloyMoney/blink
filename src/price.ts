import { Price } from "./priceImpl"

// TODO should be done on a nodejs
exports.updatePrice = functions.pubsub.schedule('every 10 minutes').onRun(async (context) => {
    const price = new Price()
    await price.update()
})