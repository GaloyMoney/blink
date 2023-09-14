# login-consent-provider

This is the User Login and Consent flow for the Galoy stack over the OAuth2 service (Hydra) in NodeJS.

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [login-consent-provider](#login-consent-provider)
  - [Overview](#overview)
  - [Running](#running)
  - [FAQ](#faq)
    - [TLS Termination](#tls-termination)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

## Overview

Apart from additions (`./routes/login.ts`, `./routes/consent.ts`) and their
respective templates, only a [CSRF Middleware] has been added. Everything else
is the standard express template.

Also, a simple helper that makes HTTP requests has been added to
`./services/hydra.js` which uses the `node-fetch` library.

To set this example up with ORY Hydra, please refer to the
[official documentation](https://www.ory.sh/docs).

## Running

Please head over to the
[ORY Hydra 5 Minute Tutorial](https://www.ory.sh/docs/hydra/5min-tutorial) to
see how this works.

## FAQ

### TLS Termination

You can mock TLS Termination by setting environment variable
`MOCK_TLS_TERMINATION` to any value, for example `MOCK_TLS_TERMINATION=y`. This
will add `X-Forwarded-Proto: https` to each HTTP Request Header.
