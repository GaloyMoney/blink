/** @type {import('next').NextConfig} */

module.exports = {
  experimental: {
    outputFileTracingRoot: require("path").join(__dirname, "../../"),
    instrumentationHook: true,
  },
  transpilePackages: ["@galoy/galoy-components"],
  output: "standalone",
}
