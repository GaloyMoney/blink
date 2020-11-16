import { iteratee } from "lodash";
import { MapDB, setupMongoConnection } from "../mongodb"
import { insertMarkers } from "../tool/map_csv_to_mongodb"

beforeAll(async () => {
  await setupMongoConnection();
})

it("inserting map data", async () => {
  await insertMarkers(true)
})