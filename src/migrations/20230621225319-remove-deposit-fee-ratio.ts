module.exports = {
  async up(db, client) {
    console.log("Begin depositFeeRatio removal")
    const res = await db
      .collection("accounts")
      .updateMany(
        {},
        { $unset: { depositFeeRatio: 1 } },
        { multi: true },
      )
    console.log({ res }, `removing depositFeeRatio fields`)
  },

  async down() {
    console.log(`rollback depositFeeRatio removal not needed`)
  }
};
