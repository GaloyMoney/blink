// TODO do we still need this??
module.exports = {
  async up(db) {
    try {
      const result = db
        .collection("users")
        .createIndex({ deviceId: 1 }, { unique: true, sparse: true })
      console.log({ result }, "index created for users/deviceId")
    } catch (error) {
      console.log({ result: error }, "error creating index for users/deviceId")
    }
  },
}
