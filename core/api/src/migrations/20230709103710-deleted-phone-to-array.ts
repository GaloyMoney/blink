module.exports = {
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  async up(db) {
    console.log("Begin migration for deletedPhones")

    const users = await db.collection("users").find({}).toArray()
    for (const user of users) {
      if (user.deletedPhone) {
        // If deletedPhone exists, convert it to an array
        await db.collection("users").updateOne(
          { _id: user._id },
          {
            $set: { deletedPhones: [user.deletedPhone] },
            $unset: { deletedPhone: 1 },
          },
        )

        // Add a closed entry to the account
        await db.collection("accounts").updateOne(
          { kratosUserId: user.userId },
          {
            $push: {
              statusHistory: {
                status: "closed",
                updatedAt: new Date(),
                comment: `Account closed via migration`,
              },
            },
          },
        )
      }
    }

    console.log("Migration for deletedPhones completed")
  },

  async down() {
    console.log(`rollback for deletedPhones not needed`)
  },
}
