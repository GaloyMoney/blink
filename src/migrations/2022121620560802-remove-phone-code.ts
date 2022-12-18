module.exports = {
  async up(db) {
    console.log("removing users")
    const updated = await db.collection("phonecodes").drop()
    console.log({ updated }, "updated users")
  },
}
