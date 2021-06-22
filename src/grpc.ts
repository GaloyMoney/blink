/* eslint-disable @typescript-eslint/no-var-requires */
const PROTO_PATH = __dirname + "/protos/price.proto"

const grpc = require("@grpc/grpc-js")
const protoLoader = require("@grpc/proto-loader")

// Suggested options for similarity to existing grpc.load behavior
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})

export const protoDescriptor = grpc.loadPackageDefinition(packageDefinition)
// The protoDescriptor object has the full package hierarchy
