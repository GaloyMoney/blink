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
Docs: https://www.ory.sh/docs/kratos/reference/api

Sessions
- `http://localhost:4434/admin/identities/{kratosId}/sessions`


Kratos Create Account Flow
----------------------
To create a brand new new account we use a combination of the Twilio api to verify codes and kratos to create a user account with session tokens. Here is the flow to create a new account.
1. The client hits the login endpoint (we don't have a registration endpoint, so even if the user does not exist they hit this endpoint)
```gql
mutation {
  userLogin(input: {
    phone: "+198765432113",
    code: "321321"
  }) {
    authToken
  }
}
```
2. `loginWithPhone (src/app/auth/login.ts)` is called and it hits the twilio api to check if the code is valid
3. If the code is valid then `AuthWithPhonePasswordlessService (src/services/kratos/auth-phone-no-passwords.ts)` is called. This kicks off the kratos flow.
```typescript
result = await kratosPublic.updateLoginFlow({
  flow: flow.data.id,
  updateLoginFlowBody: {
    identifier,
    method,
    password,
  },
})
```
4. This kicks off a flow on the kratos server. If the account does not exist, then it calls the registration webhook http://localhost:4002/kratos/registration. See the kratos middleware  `kratos-router.ts (src/servers/middlewares)`
5. Next, `createAccountWithPhoneIdentifier (src/app/accounts/create-accounts.ts)` is called
```typescript
const account = await createAccountWithPhoneIdentifier({
  newAccountInfo: { phone, kratosUserId: userIdChecked },
  config: getDefaultAccountsConfig(),
})
```
6. Finally, the new user is registered and the session token is returned. The client can use this token in an Authorization header.
```
"Authorization": "bearer {{authToken}}"
```
