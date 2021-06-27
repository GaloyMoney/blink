import jose from "node-jose"
import * as jwt from "jsonwebtoken"
import expressJwt from "express-jwt"

const { JWT_RSA_SECRET, JWT_SECRET } = process.env

// TODO: replace network by uri of the server
// the uri will embed the network, ie: graphql.mainnet.server.io
// and provide more information than just the network
export const createToken = ({ uid, network }) =>
  jwt.sign({ uid, network }, JWT_RSA_SECRET || JWT_SECRET, {
    // TODO we will also need access token (/.well-known/jwks.json) for this to work
    // otherwise, the client could still receive a fake invoice/on chain address
    // from a malicious address and the client app would not be able to
    // verify signature

    // see: https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/
    // see: https://github.com/auth0/node-jwks-rsa
    algorithm: "RS256",
  })

export function authMiddleware() {
  const secretCallback = (req, header, payload, done) => {
    let secret = JWT_SECRET

    if (header.alg === "RS256") {
      secret = JWT_RSA_SECRET || secret
    }

    done(null, secret)
  }

  return expressJwt({
    secret: secretCallback,
    algorithms: ["HS256", "RS256"],
    credentialsRequired: false,
    requestProperty: "token",
  })
}

export async function jwks(req, res) {
  const secret = JWT_RSA_SECRET || JWT_SECRET
  const jwks = await jose.JWK.asKey(secret, "pem")
  res.json(jwks.keystore.toJSON())
}
