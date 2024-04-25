```js
// TODO: PKCE flow (for alby like client, or mobile client)
// TODO: login flow with cookie
// TODO: add/use email instead of phone
```

Make sure you have `hydra` command line installed

```sh
brew install ory-hydra
```

### list oauth2 client generated from tilt

hydra list oauth2-clients -e http://localhost:4445

## loading env from automatically created client:

. ./dev/.dashboard-hydra-client.env

TODO: dashboard should have consent: true automatically

## create a OAuth2 client

Think of the client as the service that needs to get the delegation access

If you use concourse, you, as the end user, will login with Google Workspace.
The client is concourse in this example.

For the galoy stack, some examples of clients could be Alby, a boltcard service, a nostr wallet connect service, an accountant that access the wallet in read only.

from :dashboard

```sh

. ./.env

code_client=$(hydra create client \
    --name "dashboard" \
    --endpoint http://localhost:4445 \
    --grant-type authorization_code,refresh_token \
    --response-type code,id_token \
    --format json \
    --scope offline \
    --scope read \
    --scope write \
    --redirect-uri $NEXTAUTH_URL/api/auth/callback/blink \
    --skip-consent
)

export CLIENT_ID=$(echo $code_client | jq -r '.client_id')
export CLIENT_SECRET=$(echo $code_client | jq -r '.client_secret')

code_client_app_=$(hydra create client \
    --name "api" \
    --endpoint http://localhost:4445 \
    --grant-type authorization_code \
    --response-type code,id_token \
    --format json \
    --scope read \
    --scope write \
    --scope openid \
    --redirect-uri http://localhost:3001/keys/create/callback \
    --skip-consent
)

export CLIENT_ID_APP_API_KEY=$(echo $code_client_app_ | jq -r '.client_id')
export CLIENT_SECRET_APP_API_KEY=$(echo $code_client_app_ | jq -r '.client_secret')

pnpm next
```

note: skip consent should be true for trust client, ie: dashboard, but not for third party clients

to do a PKCE session:

```sh
code_client=$(hydra create client \
    --endpoint http://localhost:4445 \
    --grant-type authorization_code \
    --response-type code,id_token \
    --format json \
    --scope read --scope write \
    --redirect-uri http://localhost:5555/callback \
    --token-endpoint-auth-method none \
)

CLIENT_ID=$(echo $code_client | jq -r '.client_id')
```

## Initiate the request (if not using Dashboard)

this simulates the front end client.
would be mobile app for adding a boltcard

```sh
hydra perform authorization-code \
    --client-id $CLIENT_ID \
    --client-secret $CLIENT_SECRET \
    --endpoint http://localhost:4444/ \
    --port 5555 \
    --scope read --scope write
```

do the login and consent

copy the Access token to the mobile app.

you are now connected as the user when you add the Header `Oauth2-Token: {token}`. (note that Bearer should not be present, unlike for the Authorization header. seems to a oathkeeper quirks)

### debug

```sh
hydra introspect token \
  --format json-pretty \
  --endpoint http://localhost:4445/ \
  $ory_at_TOKEN
```

OR

```sh
curl -X POST http://localhost:4445/admin/oauth2/introspect -d token=$ory_at_TOKEN

curl -I -X POST http://localhost:4456/decisions/graphql -H "Oauth2-Token: $ory_at_TOKEN"

curl --location 'http://localhost:4455/graphql' \
--header 'Content-Type: application/json' \
--header "Oauth2-Token: $ory_at_TOKEN" \
--data '{"query":"query me {\n    me {\n        id\n        defaultAccount {\n            id\n        }\n    }\n}","variables":{}}'
```

## client_credentials

#### create client

```sh
client=$(hydra create client \
    --endpoint http://localhost:4445/ \
    --format json \
    --grant-type client_credentials \
    --scope editor \
    )
export client_id=$(echo $client | jq -r '.client_id')
export client_secret=$(echo $client | jq -r '.client_secret')
```

#### get token for client

```sh
hydra perform client-credentials \
  --endpoint http://localhost:4444/ \
  --client-id $client_id \
  --client-secret $client_secret \
  --scope editor \
  --format json
```

note: this could be a great option to use oauth2_client_credentials oathkeeper authentication
but the response is not returning the scope in the jwt

```sh
curl -s -I -X POST http://localhost:4456/decisions/graphql --user $client_id:$client_secret
```

## list OAuth 2.0 consent

```sh
export subject="9818ea5e-30a8-4b52-879d-d34590e7250e"
curl "http://localhost:4445/admin/oauth2/auth/sessions/consent?subject=$subject"

```

login_session_id (optional): The login session id to list the consent sessions for.

## change client token lifespans

https://www.ory.sh/docs/reference/api#tag/oAuth2/operation/setOAuth2ClientLifespans

## delete token by session id

export session_id="b3fc4e84-4f73-4229-acdd-9bbaba00ca60"
curl -v -X DELETE "http://localhost:4445/admin/oauth2/auth/sessions/login?sid=$session_id"

export subject=9818ea5e-30a8-4b52-879d-d34590e7250e
curl -v -X DELETE "http://localhost:4445/admin/oauth2/auth/sessions/login?subject=$subject"

# delete all

curl -v -X DELETE "http://localhost:4445/admin/oauth2/auth/sessions/consent?subject=$subject&client=$CLIENT_ID_APP_API_KEY"

curl http://localhost:4445/admin/oauth2/auth/requests/logout
