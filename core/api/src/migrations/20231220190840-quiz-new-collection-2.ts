module.exports = {
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  async up(db) {
    console.log("Begin earn removal")
    const res = await db
      .collection("accounts")
      .updateMany({}, { $unset: { earn: 1 } }, { multi: true })
    console.log({ res }, `end earn removal`)
  },
}
