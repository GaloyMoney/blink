```js
// TODO: PKCE flow (for alby like client, or mobile client)
// TODO: login flow with cookie
// TODO: add/use email instead of phone
```

Make sure you have `hydra` command line installed

```sh
brew install ory-hydra
```

# run the experiment:

Follow the instructions below


On console 1: 

launch the hydra login consent node, which will provide the authentication (interactive with kratos API) and consent page.

```sh
apps/consent % HYDRA_ADMIN_URL=http://localhost:4445 yarn start
```

On console 2:
```sh
galoy % make start
```

On console 3:
Follow the instructions below


## create a OAuth2 client

Think of the client as the service that need to get the delegation access

If you use concourse, you, as the end user, will login with Google Workspace.
The client is concourse in this example.

For the galoy stack, some examples of clients could be Alby, a boltcard service, a nostr wallet connect service, an accountant that access the wallet in read only.


```sh
dashboard $ . ./.env

code_client=$(hydra create client \
    --endpoint http://127.0.0.1:4445 \
    --grant-type authorization_code,refresh_token \
    --response-type code,id_token \
    --format json \
    --scope offline --scope transactions:read --scope payments:send \
    --redirect-uri $NEXTAUTH_URL/api/auth/callback/blink \
)

export CLIENT_ID=$(echo $code_client | jq -r '.client_id')
export CLIENT_SECRET=$(echo $code_client | jq -r '.client_secret')

dashboard $ bun next
```

to do a PKCE session:

```sh
code_client=$(hydra create client \
    --endpoint http://127.0.0.1:4445 \
    --grant-type authorization_code,refresh_token \
    --response-type code,id_token \
    --format json \
    --scope offline --scope transactions:read --scope payments:send \
    --redirect-uri http://127.0.0.1:5555/callback \
    --token-endpoint-auth-method none \
)

code_client_id=$(echo $code_client | jq -r '.client_id')
```

## Initiate the request (if not using Dashboard)

this simulate the front end client.
would be mobile app for adding a boltcard

```sh
hydra perform authorization-code \
    --client-id $code_client_id \
    --client-secret $code_client_secret \
    --endpoint http://127.0.0.1:4444/ \
    --port 5555 \
    --scope offline --scope transactions:read --scope payments:send
```

do the login and consent

copy the Access token to the mobile app.

you are now connect as the user when you add the Header `Oauth2-Token: {token}`. (not that Bearer should not be present, unlike for the Authorization header. seems to a oathkeeper quirks)

### debug

```sh
hydra introspect token \
  --format json-pretty \
  --endpoint http://127.0.0.1:4445/ \
  $ory_at_TOKEN
```

OR


```sh
curl -X POST http://localhost:4445/admin/oauth2/introspect -d token=$ory_at_TOKEN

curl -I -X POST http://localhost:4456/decisions/graphql -H "Oauth2-Token: $ory_at_TOKEN"

curl --location 'http://localhost:4002/graphql' \
--header 'Content-Type: application/json' \
--header "Oauth2-Token: $ory_at_TOKEN" \
--data '{"query":"query me {\n    me {\n        id\n        defaultAccount {\n            id\n        }\n    }\n}","variables":{}}'
```

## client_credentials

#### create client

```sh
client=$(hydra create client \
    --endpoint http://127.0.0.1:4445/ \
    --format json \
    --grant-type client_credentials \
    --scope editor \
    )
client_id=$(echo $client | jq -r '.client_id')
client_secret=$(echo $client | jq -r '.client_secret')
```

#### get token for client

```sh
hydra perform client-credentials \
  --endpoint http://127.0.0.1:4444/ \
  --client-id $client_id \
  --client-secret $client_secret \
  --scope editor
```

note: this could be a great option to use oauth2_client_credentials oathkeeper authentication
but the response is not returning the scope in the jwt

```sh
curl -s -I -X POST http://localhost:4456/decisions/graphql --user $client_id:$client_secret 
```


## list OAuth 2.0 consent

```sh
export subject=092fbf63-0b3a-422f-8260-b6f0720bf4ad
curl http://localhost:4445/admin/oauth2/auth/sessions/consent?subject=$subject

curl 'http://localhost:4445/admin/oauth2/auth/sessions/consent?subject=092fbf63-0b3a-422f-8260-b6f0720bf4ad'
```
