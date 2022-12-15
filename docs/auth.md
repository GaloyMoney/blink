Authentication Docs
===================

Currently we are using Kratos for authentication. See Ory Kratos documentation here https://www.ory.sh/docs/kratos/ory-kratos-intro

CLI
----
- cli installation https://www.ory.sh/docs/kratos/install
- make sure the KRATOS_ADMIN_URL is set in .envrc or set manually
```
KRATOS_ADMIN_URL="http://localhost:4433"
```
- list identities `kratos list identities`

SDK
---
- There is a javascript sdk for kratos called `@ory/client`.
- You can read the e2e tests to learn more here `test\e2e\integration-external-services\kratos.spec.ts`

Tests
----
- kratos e2e test `TEST="kratos.spec.ts" make e2e`


Rest Endpoints
----------
Sessions
- `http://localhost:4434/admin/identities/{kratosId}/sessions`
