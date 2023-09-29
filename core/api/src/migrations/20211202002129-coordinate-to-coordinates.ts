module.exports = {
  async up(db) {
    console.log("Begin up migration coordinates")
    const result = await db
      .collection("users")
      .updateMany({ coordinate: { $exists: true } }, [
        {
          $set: {
            coordinates: "$coordinate",
          },
        },
      ])

    console.log({ result }, "migration completed")
  },
}
