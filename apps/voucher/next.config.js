/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingRoot: require("path").join(__dirname, "../../"),
    instrumentationHook: true,
    serverComponentsExternalPackages: ["knex", "pg"],
  },
  output: "standalone",
}

module.exports = nextConfig;
