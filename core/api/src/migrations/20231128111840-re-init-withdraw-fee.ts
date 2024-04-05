module.exports = {
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  async up(db) {
    console.log("Begin withdrawFee reset")
    const res = await db
      .collection("accounts")
      .updateMany({}, { $unset: { withdrawFee: 1 } }, { multi: true })
    console.log({ res }, `resetting withdrawFee fields`)
  },

  async down() {
    console.log(`rollback withdrawFee reset not needed`)
  },
}
