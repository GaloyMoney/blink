module.exports = {
  rewrites() {
    return [{ source: "/.well-known/lnurlp/:username", destination: "/lnurlp/:username" }]
  },
  experimental: {
    outputFileTracingRoot: require("path").join(__dirname, "../../"),
    instrumentationHook: true,
    missingSuspenseWithCSRBailout: false,
  },
  output: "standalone",
}
