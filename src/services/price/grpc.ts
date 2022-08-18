/* eslint-disable @typescript-eslint/no-var-requires */
const PROTO_PATH_PRICE = __dirname + "/protos/price.proto"
const PROTO_PATH_PRICE_HISTORY = __dirname + "/protos/price_history.proto"

const grpc = require("@grpc/grpc-js")
const protoLoader = require("@grpc/proto-loader")

// Suggested options for similarity to existing grpc.load behavior
const packageDefinition = protoLoader.loadSync(PROTO_PATH_PRICE, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})

export const PriceProtoDescriptor = grpc.loadPackageDefinition(packageDefinition)
// The protoDescriptor object has the full package hierarchy

const priceHistoryPackageDefinition = protoLoader.loadSync(PROTO_PATH_PRICE_HISTORY, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})

export const PriceHistoryProtoDescriptor = grpc.loadPackageDefinition(
  priceHistoryPackageDefinition,
)
