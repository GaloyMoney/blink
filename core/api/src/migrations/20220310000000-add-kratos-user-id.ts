module.exports = {
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  async up(db) {
    try {
      let result = await db.collection("users").dropIndex("phone_1")
      console.log({ result }, "index dropped for users/phone_1")

      result = db
        .collection("users")
        .createIndex({ phone: 1 }, { unique: true, sparse: true })
      console.log({ result }, "index created for users/phone")
    } catch (error) {
      console.log({ result: error }, "index dropped for users/phone_1")
    }
  },
}
