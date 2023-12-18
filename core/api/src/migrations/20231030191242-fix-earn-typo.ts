/* eslint @typescript-eslint/ban-ts-comment: "off" */
// @ts-nocheck
module.exports = {
  async up(db) {
    const incorrectSpelling = "moneySocialAggrement"
    const correctSpelling = "moneySocialAgreement" // spelling fixed in this pr https://github.com/GaloyMoney/galoy/pull/3306/files

    try {
      await db
        .collection("accounts")
        .updateMany({ earn: incorrectSpelling }, { $set: { "earn.$": correctSpelling } })
    } catch (error) {
      console.log({ result: error }, `Couldn't update accounts`)
    }
  },
}
