import newman from "newman"
import { collection } from "./graphql.postman_collection.json"

const environment = process.env.LOCAL
  ? require(`./devnet-local.postman_environment.json`)
  : require(`./devnet.postman_environment.json`)

newman.run(
  {
    collection,
    environment,
    reporters: "cli",
  },
  function (err, summary) {
    if (err) {
      throw err
    }
    // console.log(JSON.stringify(summary, null, 4))
    console.log(JSON.stringify(summary.run.failures, null, 2))
  },
)
