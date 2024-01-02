import { authenticator } from "otplib"

const secret = process.argv[3]
console.log(authenticator.generate(secret))
