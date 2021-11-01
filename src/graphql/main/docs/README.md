# Lightning Integration

## Overview
The API endpoints are

testnet: `https://api.testnet.galoy.io/graphql`

mainnet: `https://api.mainnet.galoy.io/graphql`

## Authentication
To get a new JWT:
1. Use `userRequestAuthCode` to receive an auth code via SMS
2. Call `userLogin` using the same phone number and auth code

All other methods require a valid JWT set in the header as a bearer token - `Authorization: Bearer`

## Curl requests

### userRequestAuthCode

```
curl --location --request POST 'https://api.testnet.galoy.io/graphql' --header 'Content-Type: application/json' --data-raw '{"query":"mutation userRequestAuthCode ($input: UserRequestAuthCodeInput!) {\n    userRequestAuthCode (input: $input) {\n        errors {\n            message\n            path\n        }\n        success\n    }\n}","variables":{"input":{"phone":666397746837462800}}}'
```

### userLogin

```
curl --location --request POST 'https://api.testnet.galoy.io/graphql' --header 'Content-Type: application/json' --data-raw '(...)'
```

### lnInvoiceCreate

```
curl --location --request POST 'https://api.mainnet.galoy.io/graphql' --header 'Authorization: Bearer <token>' --header 'Content-Type: application/json' --data-raw '{"query":"mutation lnInvoiceCreate ($input: LnInvoiceCreateInput!) {\n    lnInvoiceCreate (input: $input) {\n        errors {\n            message\n            path\n        }\n        invoice {\n            paymentRequest\n            paymentHash\n            paymentSecret\n            satoshis\n        }\n    }\n}","variables":{}}'
```

### lnInvoicePaymentStatus

```
curl --location --request POST 'https://api.mainnet.galoy.io/graphql' --header 'Authorization: Bearer <token>' --header 'Content-Type: application/json' --data-raw '{"query":"subscription lnInvoicePaymentStatus ($input: LnInvoicePaymentStatusInput!) {\n    lnInvoicePaymentStatus (input: $input) {\n        errors {\n            message\n            path\n        }\n        status\n    }\n}","variables":{"input":{"paymentRequest":"<paymentRequest>"}}}'
```

## Extra Resources

If you use Postman, we have a collection you can import to test the API. 

Download it here: [Lightning Integration.postman_collection.json](https://github.com/GaloyMoney/galoy/tree/main/src/graphql/main/docs/Lightning-Integration.postman_collection.json)

