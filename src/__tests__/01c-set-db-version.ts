/**
 * @jest-environment node
 */
import { setupMongoConnection, DbVersion } from "../mongodb";
const mongoose = require("mongoose");


beforeAll(async () => {
  await setupMongoConnection()
})

afterAll(async () => {
	await mongoose.connection.close()
})


it('db version', async () => {
  const dbVersion = new DbVersion()
  dbVersion.version = 1
  await dbVersion.save()
})

