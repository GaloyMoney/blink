import newman from "newman"
import { collection } from "./graphql.postman-collection.json"

const environment = process.env.LOCAL
  ? require(`./devnet-local.postman-environment.json`)
  : require(`./devnet.postman-environment.json`)

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
