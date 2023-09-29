// eslint-disable-next-line
const { authenticator } = require("otplib")
const secret = process.argv[2]
console.log(authenticator.generate(secret))
