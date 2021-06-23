import * as jwt from "jsonwebtoken"
console.log(jwt.decode(process.argv[2], { complete: true }))
