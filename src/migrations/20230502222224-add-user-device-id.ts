// TODO do we still need this??
module.exports = {
  async up(db) {
    try {
      const result = db
        .collection("users")
        .createIndex({ device: 1 }, { unique: true, sparse: true })
      console.log({ result }, "index created for users/device")
    } catch (error) {
      console.log({ result: error }, "error creating index for users/device")
    }
  },
}
