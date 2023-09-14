// Copyright © 2023 Ory Corp
// SPDX-License-Identifier: Apache-2.0

import express from "express"
import url from "url"
import urljoin from "url-join"
import csrf from "csurf"
import { hydraClient } from "../config"
import { oidcConformityMaybeFakeSession } from "./stub/oidc-cert"

// Sets up csrf protection
const csrfProtection = csrf({
  cookie: {
    sameSite: "lax",
  },
})
const router = express.Router()

router.get("/", csrfProtection, (req, res, next) => {
  // Parses the URL query
  const query = url.parse(req.url, true).query

  // The challenge is used to fetch information about the consent request from ORY hydraClient.
  const challenge = String(query.consent_challenge)
  if (!challenge) {
    next(new Error("Expected a consent challenge to be set but received none."))
    return
  }

  // This section processes consent requests and either shows the consent UI or
  // accepts the consent request right away if the user has given consent to this
  // app before
  hydraClient
    .getOAuth2ConsentRequest({ consentChallenge: challenge })
    // This will be called if the HTTP request was successful
    .then(({ data: body }) => {
      // If a user has granted this application the requested scope, hydra will tell us to not show the UI.
      // Any cast needed because the SDK changes are still unreleased.
      // TODO: Remove in a later version.
      if (body.skip || (body.client as any)?.skip_consent) {
        // You can apply logic here, for example grant another scope, or do whatever...
        // ...

        // FIXME: doesn't seem to work
        // body.requested_scope?.push("offline")

        // Now it's time to grant the consent request. You could also deny the request if something went terribly wrong
        return hydraClient
          .acceptOAuth2ConsentRequest({
            consentChallenge: challenge,
            acceptOAuth2ConsentRequest: {
              // We can grant all scopes that have been requested - hydra already checked for us that no additional scopes
              // are requested accidentally.
              grant_scope: body.requested_scope,

              // ORY Hydra checks if requested audiences are allowed by the client, so we can simply echo this.
              grant_access_token_audience: body.requested_access_token_audience,

              // The session allows us to set session data for id and access tokens
              session: {
                // This data will be available when introspecting the token. Try to avoid sensitive information here,
                // unless you limit who can introspect tokens.
                access_token: { card: "alice" },
                // This data will be available in the ID token.
                id_token: { who: "bob" },
              },
            },
          })
          .then(({ data: body }) => {
            // All we need to do now is to redirect the user back to hydra!
            res.redirect(String(body.redirect_to))
          })
      }

      // If consent can't be skipped we MUST show the consent UI.
      res.render("consent", {
        csrfToken: req.csrfToken(),
        challenge: challenge,
        // We have a bunch of data available from the response, check out the API docs to find what these values mean
        // and what additional data you have available.
        requested_scope: body.requested_scope,
        user: body.subject,
        client: body.client,
        action: urljoin(process.env.BASE_URL || "", "/consent"),
      })
    })
    // This will handle any error that happens when making HTTP calls to hydra
    .catch(next)
  // The consent request has now either been accepted automatically or rendered.
})

router.post("/", csrfProtection, (req, res, next) => {
  // The challenge is now a hidden input field, so let's take it from the request body instead
  const challenge = req.body.challenge

  // Let's see if the user decided to accept or reject the consent request..
  if (req.body.submit === "Deny access") {
    // Looks like the consent request was denied by the user
    return (
      hydraClient
        .rejectOAuth2ConsentRequest({
          consentChallenge: challenge,
          rejectOAuth2Request: {
            error: "access_denied",
            error_description: "The resource owner denied the request",
          },
        })
        .then(({ data: body }) => {
          // All we need to do now is to redirect the browser back to hydra!
          res.redirect(String(body.redirect_to))
        })
        // This will handle any error that happens when making HTTP calls to hydra
        .catch(next)
    )
  }
  // label:consent-deny-end

  let grantScope = req.body.grant_scope
  if (!Array.isArray(grantScope)) {
    grantScope = [grantScope]
  }

  // The session allows us to set session data for id and access tokens
  let session = {
    // This data will be available when introspecting the token. Try to avoid sensitive information here,
    // unless you limit who can introspect tokens.
    access_token: { card: "alice" },
    // This data will be available in the ID token.
    id_token: { card: "bob" },
  }

  // Here is also the place to add data to the ID or access token. For example,
  // if the scope 'profile' is added, add the family and given name to the ID Token claims:
  // if (grantScope.indexOf('profile')) {
  //   session.id_token.family_name = 'Doe'
  //   session.id_token.given_name = 'John'
  // }

  // Let's fetch the consent request again to be able to set `grantAccessTokenAudience` properly.
  hydraClient
    .getOAuth2ConsentRequest({ consentChallenge: challenge })
    // This will be called if the HTTP request was successful
    .then(({ data: body }) => {
      return hydraClient
        .acceptOAuth2ConsentRequest({
          consentChallenge: challenge,
          acceptOAuth2ConsentRequest: {
            // We can grant all scopes that have been requested - hydra already checked for us that no additional scopes
            // are requested accidentally.
            grant_scope: grantScope,

            // If the environment variable CONFORMITY_FAKE_CLAIMS is set we are assuming that
            // the app is built for the automated OpenID Connect Conformity Test Suite. You
            // can peak inside the code for some ideas, but be aware that all data is fake
            // and this only exists to fake a login system which works in accordance to OpenID Connect.
            //
            // If that variable is not set, the session will be used as-is.
            session: oidcConformityMaybeFakeSession(grantScope, body, session),

            // ORY Hydra checks if requested audiences are allowed by the client, so we can simply echo this.
            grant_access_token_audience: body.requested_access_token_audience,

            // This tells hydra to remember this consent request and allow the same client to request the same
            // scopes from the same user, without showing the UI, in the future.
            remember: Boolean(req.body.remember),

            // When this "remember" session expires, in seconds. Set this to 0 so it will never expire.
            remember_for: 3600,
          },
        })
        .then(({ data: body }) => {
          // All we need to do now is to redirect the user back to hydra!
          res.redirect(String(body.redirect_to))
        })
    })
    // This will handle any error that happens when making HTTP calls to hydra
    .catch(next)
  // label:docs-accept-consent
})

export default router
