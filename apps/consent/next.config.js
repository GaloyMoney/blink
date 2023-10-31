/** @type {import('next').NextConfig} */

module.exports = {
  experimental: {
    serverActions: true,
    outputFileTracingRoot: require("path").join(__dirname, "../../"),
    instrumentationHook: true,
  },
  output: "standalone",
}
