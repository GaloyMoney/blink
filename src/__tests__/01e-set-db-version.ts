/**
 * @jest-environment node
 */
import { setupMongoConnection } from "../mongodb";
import mongoose from "mongoose";
import { DbVersion } from "../schema";


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
