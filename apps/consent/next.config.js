/** @type {import('next').NextConfig} */

module.exports = {
  experimental: {
    outputFileTracingRoot: require("path").join(__dirname, "../../"),
    instrumentationHook: true,
  },
  output: "standalone",
}
