/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
    outputFileTracingRoot: require("path").join(__dirname, "../../"),
    instrumentationHook: true,
  },
  output: "standalone",
}

module.exports = nextConfig
