// Copyright © 2023 Ory Corp
// SPDX-License-Identifier: Apache-2.0

import express from "express"
import url from "url"
import urljoin from "url-join"
import csrf from "csurf"
import { hydraClient } from "../config"
import { oidcConformityMaybeFakeAcr } from "./stub/oidc-cert"
import axios from "axios"
import { OAuth2LoginRequest, OAuth2RedirectTo } from "@ory/hydra-client"

// Sets up csrf protection
const csrfProtection = csrf({
  cookie: {
    sameSite: "lax",
  },
})
const router = express.Router()

const authUrl = "http://localhost:4002"

router.get("/", csrfProtection, async (req, res, next) => {
  // Parses the URL query
  const query = url.parse(req.url, true).query

  // The challenge is used to fetch information about the login request from ORY Hydra.
  const challenge = String(query.login_challenge)
  if (!challenge) {
    next(new Error("Expected a login challenge to be set but received none."))
    return
  }

  let body: OAuth2LoginRequest

  try {
    const { data } = await hydraClient.getOAuth2LoginRequest({
      loginChallenge: challenge,
    })
    body = data
  } catch (err) {
    // This will handle any error that happens when making HTTP calls to hydra
    next(err)
    return
  }

  // If hydra was already able to authenticate the user, skip will be true and we do not need to re-authenticate
  // the user.
  if (body.skip) {
    // You can apply logic here, for example update the number of times the user logged in.
    // ...

    // Now it's time to grant the login request. You could also deny the request if something went terribly wrong
    // (e.g. your arch-enemy logging in...)
    let response: OAuth2RedirectTo
    try {
      const { data } = await hydraClient.acceptOAuth2LoginRequest({
        loginChallenge: challenge,
        acceptOAuth2LoginRequest: {
          // All we need to do is to confirm that we indeed want to log in the user.
          subject: String(body.subject),
        },
      })
      response = data
    } catch (err) {
      next(err)
      return
    }

    res.redirect(String(response.redirect_to))
    return
  }

  // If authentication can't be skipped we MUST show the login UI.
  res.render("login", {
    csrfToken: req.csrfToken(),
    challenge: challenge,
    action: urljoin(process.env.BASE_URL || "", "/login"),
    hint: body.oidc_context?.login_hint || "",
  })
})

router.post("/", csrfProtection, async (req, res, next) => {
  // The challenge is now a hidden input field, so let's take it from the request body instead
  const challenge = req.body.challenge

  // Let's see if the user decided to accept or reject the consent request..
  if (req.body.submit === "Deny access") {
    // Looks like the consent request was denied by the user
    try {
      const response = await hydraClient.rejectOAuth2LoginRequest({
        loginChallenge: challenge,
        rejectOAuth2Request: {
          error: "access_denied",
          error_description: "The resource owner denied the request",
        },
      })

      res.redirect(String(response.data.redirect_to))
    } catch (err) {
      // This will handle any error that happens when making HTTP calls to hydra
      next(err)
    }
  }

  const email = req.body.email

  const url = `${authUrl}/auth/email/code`

  let emailLoginId: string

  try {
    const result = await axios.post(url, {
      email,
    })
    emailLoginId = result.data.result
  } catch (err) {
    // TODO: error layout
    console.error(err)
    return
  }

  // TODO: manage error on ip rate limit
  // TODO: manage error when trying the same email too often

  if (emailLoginId) {
    console.log({ emailLoginId })
    res.render("verification", {
      csrfToken: req.csrfToken(),
      challenge: challenge,
      email,
      emailLoginId,
      action: urljoin(process.env.BASE_URL || "", "login/verification"),
    })
  } else {
    console.warn("no flow returned")
  }

  return
})

router.post("/verification", csrfProtection, async (req, res, next) => {
  // The challenge is now a hidden input field, so let's take it from the request body instead
  const challenge = req.body.challenge
  const code = req.body.code as String
  const emailLoginId = req.body.emailLoginId as String

  const url = `${authUrl}/auth/email/login`

  const res2 = await axios.post(url, {
    code,
    emailLoginId,
  })

  const authToken = res2.data.result.authToken
  const totpRequired = res2.data.result.totpRequired
  const userId = res2.data.result.id

  console.log("authToken", authToken)

  // Let's check if the user provided valid credentials.
  if (!authToken) {
    // Looks like the user provided invalid credentials, let's show the ui again...

    res.render("verification", {
      csrfToken: req.csrfToken(),
      challenge: challenge,
      error: "The email / code combination is not correct",
    })

    return
  }

  // TODO: me query to get userId

  // Seems like the user authenticated! Let's tell hydra...

  const response = await hydraClient.getOAuth2LoginRequest({
    loginChallenge: challenge,
  })

  const loginRequest = response.data

  try {
    const response2 = await hydraClient.acceptOAuth2LoginRequest({
      loginChallenge: challenge,
      acceptOAuth2LoginRequest: {
        // Subject is an alias for user ID. A subject can be a random string, a UUID, an email address, ....
        subject: userId,

        // This tells hydra to remember the browser and automatically authenticate the user in future requests. This will
        // set the "skip" parameter in the other route to true on subsequent requests!
        remember: Boolean(req.body.remember),

        // When the session expires, in seconds. Set this to 0 so it will never expire.
        remember_for: 3600,

        // Sets which "level" (e.g. 2-factor authentication) of authentication the user has. The value is really arbitrary
        // and optional. In the context of OpenID Connect, a value of 0 indicates the lowest authorization level.
        // acr: '0',
        //
        // If the environment variable CONFORMITY_FAKE_CLAIMS is set we are assuming that
        // the app is built for the automated OpenID Connect Conformity Test Suite. You
        // can peak inside the code for some ideas, but be aware that all data is fake
        // and this only exists to fake a login system which works in accordance to OpenID Connect.
        //
        // If that variable is not set, the ACR value will be set to the default passed here ('0')
        acr: oidcConformityMaybeFakeAcr(loginRequest, "0"),
      },
    })

    // All we need to do now is to redirect the user back to hydra!
    res.redirect(String(response2.data.redirect_to))
  } catch (err) {
    next(err)
  }

  // You could also deny the login request which tells hydra that no one authenticated!
  // hydra.rejectLoginRequest(challenge, {
  //   error: 'invalid_request',
  //   errorDescription: 'The user did something stupid...'
  // })
  //   .then(({body}) => {
  //     // All we need to do now is to redirect the browser back to hydra!
  //     res.redirect(String(body.redirectTo));
  //   })
  //   // This will handle any error that happens when making HTTP calls to hydra
  //   .catch(next);
})

export default router
