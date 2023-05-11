// cd dev/ory && ts-node gen-test-jwt.ts
import fs from "fs"
import * as jose from "node-jose"
import jsonwebtoken from "jsonwebtoken"
import jwksRsa from "jwks-rsa"
import path from "path"

const jwksFilePath = "./jwks.json"
const jwksUri = "https://firebaseappcheck.googleapis.com/v1beta/jwks"
const sub = "1:72279297366:android:TESTE2EACCOUNT5aa75af7"
const aud = ["projects/72279297366", "projects/galoyapp"]
const iss = "https://firebaseappcheck.googleapis.com/72279297366"
const jwksFile = fs.readFileSync(jwksFilePath, "utf-8")
const jwks = JSON.parse(jwksFile)
const jwk = jwks.keys[0]
const keystore = jose.JWK.createKeyStore()
const isDev = true

async function main() {
  const token = await genToken({
    sub,
    aud,
    provider: "debug",
    iss,
  })
  console.log("JWT:", token)

  // Dummy firebase jwt
  // const token =
  //   "eyJraWQiOiJsWUJXVmciLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxOjcyMjc5Mjk3MzY2OmFuZHJvaWQ6MzU2NjY4MDdhZTkxNmM1YWE3NWFmNyIsImF1ZCI6WyJwcm9qZWN0c1wvNzIyNzkyOTczNjYiLCJwcm9qZWN0c1wvZ2Fsb3lhcHAiXSwicHJvdmlkZXIiOiJkZWJ1ZyIsImlzcyI6Imh0dHBzOlwvXC9maXJlYmFzZWFwcGNoZWNrLmdvb2dsZWFwaXMuY29tXC83MjI3OTI5NzM2NiIsImV4cCI6MTY4MzYwMDA2OSwiaWF0IjoxNjgzNTk2NDY5LCJqdGkiOiJocHZEUXJvcGR2QzdJc0lDSEd3TkJna2lmMmMtSGM3b2sxcW5MRWcwaGZJIn0.eENwF1wbVyyWhGAW_87j57JkKQ4L07nCWuS9JtaUyH5N3PUsjK4Ru_2Ycf2DtMiA-eUeW2oKa_qfiZeICt6JicVwp_LWMqS0CsflatTqNk3dX1AVvmzX2e_KJHOqDV6Pr2nWzUjj6WF-Z87oyPSQZxezlSCSoJYZrfy-_3pHwY5MQJ7Npv0DBrnPPb3oM2-FC5zPpYKS5FB3KAH6VMdZzWqAJz_VLPylc9DAPftj4OMtyvNzcfKnbO_UkcBI7O0Da1C8wDfa8102k-K2h5SJKPOUEE3Rp44nRHpl8fT2EucN2dYnubEJZRQv3I_q23T8pm6FJddQPffBbPYjhsdSyz0WlLeeJ0Wcw3A7wz1xzdENbRGd6zQ7zULP_pdFk0qbL_xGYH2HWsAPYpGxkIVU7mQT-8W3ygV1q5DnanLBLfQ_pcDD0Rv0h7l51VCpUjRN03VwVs0kzCFOdco-r6VI_x06OtwMJ_LKGAPTOzM1sSu8iE81uNTGut_WO-EN3Fn3"

  const verifiedToken = await verifyToken(token)
  console.log("verifiedToken:", verifiedToken)
}

async function genToken(payload) {
  // Create a JWT without an expiration time
  const options = {
    header: { alg: "RS256", kid: jwk.kid },
    expiresIn: undefined,
  }
  // Sign the JWT with the private key
  // Add the JWK to the key store
  const key = await keystore.add(jwk)
  const token = await jose.JWS.createSign(
    { format: "compact", fields: options.header },
    key,
  )
    .update(JSON.stringify(payload))
    .final()
  return token
}

async function verifyToken(token) {
  // Get the JSON web keys (JWKS)
  const client = await jwksRsa({
    jwksUri,
  })
  let jwkJson
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jwkJson = (await client.getKeys()) as Array<any>

  // Decode the token
  const decodedToken = jsonwebtoken.decode(token, { complete: true })
  if (!decodedToken) return Error("problem with jwt")

  // Find the kid (Key Id) used to sign the token
  const kid = decodedToken.header.kid
  let kidJwk = jwkJson.find((j) => j.kid === kid)

  // if in dev environment, use local jwks.json if you dont have access to firebase appcheck debug token
  if (!kidJwk && isDev) {
    const jwkPath = jwksFilePath
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jwksFile = require(jwkPath)
    jwkJson = jwksFile.keys
    kidJwk = jwkJson.find((j) => j.kid === kid)
  }

  // Create a Key object from the JWK and to PEM format
  const jwtAskey = await jose.JWK.asKey(kidJwk)
  const pem = jwtAskey.toPEM(false)

  // Verify the token
  const verifiedToken = jsonwebtoken.verify(token, pem, {
    algorithms: ["RS256"],
    audience: aud,
    issuer: iss,
  })
  return verifiedToken
}

main()
