// this script generates and verifies a JSON Web Token (JWT), using the 'node-jose', 'jsonwebtoken', and 'jwks-rsa' packages.
// It uses a local 'jwks.json' file for key storage and verification

// cd dev/bin && ts-node gen-test-jwt.ts
import fs from "fs"
import * as jose from "node-jose"
import jsonwebtoken from "jsonwebtoken"
import jwksRsa from "jwks-rsa"

const jwksFilePath = "../ory/jwks.json"
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
    exp: 2639000069,
    jti: "RCgwmNlmbZdEwdYz486XkD2xkLTkWGpiCXBxXW1RQCk",
  })
  console.log("JWT:", token)

  // Dummy firebase jwt
  // const token =
  //   "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFiOTdiMjIxLWNhMDgtNGViMi05ZDA5LWE1NzcwZmNjZWIzNyJ9.eyJzdWIiOiIxOjcyMjc5Mjk3MzY2OmFuZHJvaWQ6VEVTVEUyRUFDQ09VTlQ1YWE3NWFmNyIsImF1ZCI6WyJwcm9qZWN0cy83MjI3OTI5NzM2NiIsInByb2plY3RzL2dhbG95YXBwIl0sInByb3ZpZGVyIjoiZGVidWciLCJpc3MiOiJodHRwczovL2ZpcmViYXNlYXBwY2hlY2suZ29vZ2xlYXBpcy5jb20vNzIyNzkyOTczNjYiLCJleHAiOjI2MzkwMDAwNjl9.Fh11HcuTal_S_26xFwIUWYivY0NzKGYrpBwNgQ-1QnfLZwUaHlMCX4hj4tcRJiKMX2UU_pnZCWgVnBqM9rbeSLFj35OvyP0z4rnflLOOl-UBrQQs4pVSUCpmh8eLX5lkh27KhdGOifND3jJPkKhPeVI9-hpZKNTYdU9y3M1yFF4BjvHs05nf8Zu3tWfpj0_LNPE-H0eXiiHaEUDv_GPA4HgLSAyxdh8bFoVC36UjpG-vm8Tt7jOUDnGc3s7jQk_lIJ3uCs8JXU4LfhSAQS6Q9UYmpFFUgsrUaZ6T_o2XTZtHgd_9qOUVvTChL-0dDGyDvB1tzofwIzLwxj7TGoEDGQ"

  // const verifiedToken = await verifyToken(token)
  // console.log("verifiedToken:", verifiedToken)
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
