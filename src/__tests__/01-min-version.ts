/**
 * @jest-environment node
 */
 import { setupMongoConnection } from "../mongodb";

 import {lndMain, lndOutside1, lndOutside2} from "./helper"
 import { bitcoindDefaultClient } from "../utils";
 import mongoose from "mongoose";
import { DbMetadata } from "../schema";
 
 jest.mock('../realtimePrice')
 
 
 it('set min version for graphql', async () => {
  await setupMongoConnection()
  await DbMetadata.create({ minBuildNumber: 200, lastBuildNumber: 200 })
  await mongoose.connection.close()
 })
