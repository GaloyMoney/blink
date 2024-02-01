/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingRoot: require("path").join(__dirname, "../../"),
    serverActions: true,
    instrumentationHook: true,
  },
  output: "standalone",
}

module.exports = nextConfig
