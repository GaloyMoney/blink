module.exports = {
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  async up(db) {
    const indexesToDelete = [
      "accounts_1_book_1_datetime_-1_timestamp_-1",
      "datetime_-1_timestamp_-1",
      "account_path.0_1_book_1",
      "account_path.0_1_account_path.1_1_book_1",
      "account_path.0_1_account_path.1_1_account_path.2_1_book_1"
    ]

    for (const indexName of indexesToDelete) {
      try {
        const result = await db.collection("medici_transactions").dropIndex(indexName)
        console.log({ result }, `Index dropped for medici_transactions/${indexName}`)
      } catch (error) {
        console.error({ error }, `Error dropping index for medici_transactions/${indexName}`)
      }
    }
  }
}
