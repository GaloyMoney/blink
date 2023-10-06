module.exports = {
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  async up(db) {
    console.log("Begin adding status history to users collection")
    const users = db.collection("users").find({}, { status: 1 })

    let progress = 0
    for await (const user of users) {
      progress++

      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $set: {
            statusHistory: [{ status: user.status, comment: "Imported Status" }],
          },
        },
      )

      if (progress % 1000 === 0) {
        console.log(`${progress} users updated`)
      }
    }

    console.log("Finish adding status history to users collection")
  },

  // @ts-ignore-next-line no-implicit-any error
  async down(db) {
    await removeAttributes(db.collection("users"), ["statusHistory"])
    db.collection("users").updateMany(
      {},
      {
        $unset: { statusHistory: "" },
      },
    )
  },
}
