/* eslint-disable @typescript-eslint/no-var-requires */
const PROTO_PATH_BRIA = __dirname + "/protos/bria.proto"

const grpc = require("@grpc/grpc-js")
const protoLoader = require("@grpc/proto-loader")

// Suggested options for similarity to existing grpc.load behavior
const packageDefinition = protoLoader.loadSync(PROTO_PATH_BRIA, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})

export const BriaProtoDescriptor = grpc.loadPackageDefinition(packageDefinition)
