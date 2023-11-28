module.exports = {
  rewrites() {
    return [{ source: "/.well-known/lnurlp/:username", destination: "/lnurlp/:username" }]
  },
}
