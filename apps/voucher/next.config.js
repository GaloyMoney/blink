/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingRoot: require("path").join(__dirname, "../../"),
    instrumentationHook: true,
    serverComponentsExternalPackages: ["knex", "pg"],
    outputFileTracingIncludes: {
      "./": ["./services/db/migrations/**/*"],
    },
  },
  output: "standalone",
}

module.exports = nextConfig
