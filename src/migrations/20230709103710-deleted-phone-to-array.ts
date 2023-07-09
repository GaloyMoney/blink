module.exports = {
  async up(db) {
    console.log("Begin migration for deletedPhones")

    const users = await db.collection("users").find({}).toArray()
    for (const user of users) {
      if (user.deletedPhone) {
        // If deletedPhones exists and it's not an array, convert it to an array
        if (!Array.isArray(user.deletedPhone)) {
          await db.collection("users").updateOne(
            { _id: user._id },
            {
              $set: { deletedPhones: [user.deletedPhone] },
              $unset: { deletedPhone: 1 },
            },
          )
        }
      } else {
        // If deletedPhones does not exist, initialize it as an empty array
        await db
          .collection("users")
          .updateOne({ _id: user._id }, { $set: { deletedPhones: [] } })
      }
    }

    console.log("Migration for deletedPhones completed")
  },

  async down() {
    console.log(`rollback for deletedPhones not needed`)
  },
}
