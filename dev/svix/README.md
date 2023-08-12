create an application:

```
variables=$(
  jq -n \
  --arg account_id "account.$account_id" \
  '{ "name": "Client application", "uid": $account_id }' \
)

curl --silent -X 'POST' \
  'http://127.0.0.1:8071/api/v1/app/' \
  -H "Authorization: Bearer $SVIX_SECRET" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d "$variables" | jq
```

get the applications:

```
curl --silent -X 'GET' \
  "$SVIX_ENDPOINT/api/v1/app/" \
  -H "Authorization: Bearer $SVIX_SECRET" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' | jq
```

set account_path value:

```
export account_path=$(curl --silent -X 'GET' \
  "$SVIX_ENDPOINT/api/v1/app/" \
  -H "Authorization: Bearer $SVIX_SECRET" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' | jq -r '.data[1].uid')
```

list endpoints:
```
curl --silent -X 'GET' \
  "$SVIX_ENDPOINT/api/v1/app/$account_path/endpoint/" \
  -H "Authorization: Bearer $SVIX_SECRET" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' | jq
```

add endpoint:

```
curl --silent -X 'POST' \
  "$SVIX_ENDPOINT/api/v1/app/$account_path/endpoint/" \
  -H "Authorization: Bearer $SVIX_SECRET" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
        "description": "An example endpoint name",
        "url": "http://host.docker.internal:8080/webhook/",
        "version": 1,
        "secret": "whsec_abcd1234abcd1234abcd1234abcd1234"
      }' | jq
```


create message:

```
curl --silent -X 'POST' \
  "$SVIX_ENDPOINT/api/v1/app/$account_path/msg/" \
  -H "Authorization: Bearer $SVIX_SECRET" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
        "eventType": "user.signup",
        "payload": {"email":"test@example.com","type":"user.created","username":"test_user"}
    }' | jq
```

list messages:

```
curl --silent -X 'GET' \
  "$SVIX_ENDPOINT/api/v1/app/$account_path/msg/" \
  -H "Authorization: Bearer $SVIX_SECRET" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' | jq
```

get message attempts (update msdig first):

```
msgid="msg_2TsrIn1bYT3Jc8tcJMg6sF18fa1" && \
curl --silent -X 'GET' \
  "$SVIX_ENDPOINT/api/v1/app/$account_path/attempt/msg/$msgid/" \
  -H "Authorization: Bearer $SVIX_SECRET" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' | jq
```