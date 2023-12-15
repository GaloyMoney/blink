const user = process.env.MONGODB_USER
const password = process.env.MONGODB_PASSWORD
const address = process.env.MONGODB_ADDRESS ?? "localhost"
const db = process.env.MONGODB_DATABASE ?? "galoy"

let url
if (user && password) {
  url = `mongodb://${user}:${password}@${address}/${db}`
} else {
  url = `mongodb://${address}/${db}`
  console.log({ path: url }, "Connecting to MongoDB without a username and password")
}

const config = {
  mongodb: {
    url,
    options: {
      useNewUrlParser: true, // removes a deprecation warning when connecting
      useUnifiedTopology: true, // removes a deprecating warning when connecting
      //   connectTimeoutMS: 3600000, // increase connection timeout to 1 hour
      //   socketTimeoutMS: 3600000, // increase socket timeout to 1 hour
    },
  },

  // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
  migrationsDir: "src/migrations",

  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: "changelog",

  // The file extension to create migrations and search for in migration dir
  migrationFileExtension: ".ts",

  // Enable the algorithm to create a checksum of the file contents and use that in the comparison to determine
  // if the file should be run.  Requires that scripts are coded to be run multiple times.
  useFileHash: false,

  // Can be 'commonjs' or 'esm'
  moduleSystem: "commonjs",
}

// Return the config as a promise
module.exports = config
