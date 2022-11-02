# Lightning Integration

## Overview
The staging API endpoint is: `https://api.staging.galoy.io/graphql`

## Authentication
To get a new JWT:
1. Use `userRequestAuthCode` to receive an auth code via SMS
2. Call `userLogin` using the same phone number and auth code

All other methods require a valid JWT set in the header as a bearer token - `Authorization: Bearer`

## Curl requests

### userRequestAuthCode

#### query
```bash
export URI=https://api.staging.galoy.io/graphql
export PHONE='+12025550148'
curl --location --request POST $URI --header 'Content-Type: application/json' --data-raw '{"query":"mutation userRequestAuthCode ($input: UserRequestAuthCodeInput!) {\n    userRequestAuthCode (input: $input) {\n        errors {\n            message\n            path\n        }\n        success\n    }\n}","variables":{"input":{"phone":"'"$PHONE"'"}}}'
```

#### response
```json
{
    "data": {
        "userRequestAuthCode": {
            "errors": [],
            "success": true
        }
    }
}
```


### userLogin

#### query
```bash
export CODE='012345'
curl --location --request POST $URI --header 'Content-Type: application/json' --data-raw '{"query":"mutation userLogin ($input: UserLoginInput!) {\n    userLogin (input: $input) {\n        errors {\n            message\n            path\n        }\n        authToken\n    }\n}","variables":{"input":{"phone":"'"$PHONE"'","code":"'"$CODE"'"}}}'
```

#### response
```json
{
    "data": {
        "userLogin": {
            "errors": [],
            "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiI1ZjkwMTY3ODM2MmZmNjIzMjVkZmFmYjciLCJuZXR3b3JrIjoicmVndGVzdCIsImN1cnJlbmN5IjoiQlRDIiwiaWF0IjoxNjAzMjc4NDU2fQ.-im7fJS_andM32zNXDVqSDPPoQtCtCE22X-hUclT3u0"
        }
    }
}
```

### lnInvoiceCreate

#### query
```bash
export AUTH_TOKEN='Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiI1ZjkwMTY3ODM2MmZmNjIzMjVkZmFmYjciLCJuZXR3b3JrIjoicmVndGVzdCIsImN1cnJlbmN5IjoiQlRDIiwiaWF0IjoxNjAzMjc4NDU2fQ.-im7fJS_andM32zNXDVqSDPPoQtCtCE22X-hUclT3u0'
export AMOUNT=12345
export MEMO='tipping'
curl --location --request POST $URI --header "$AUTH_TOKEN" --header 'Content-Type: application/json' --data-raw '{"query":"mutation lnInvoiceCreate ($input: LnInvoiceCreateInput!) {\n    lnInvoiceCreate (input: $input) {\n        errors {\n            message\n            path\n        }\n        invoice {\n            paymentRequest\n            paymentHash\n            paymentSecret\n            satoshis\n        }\n    }\n}","variables":{"input":{"amount":"'"$AMOUNT"'","memo":"'"$MEMO"'"}}}'
```

#### response
```json
{
    "data": {
        "lnInvoiceCreate": {
            "errors": [],
            "invoice": {
                "paymentRequest": "lntb123450n1pscxulepp59x872uskmr0a4r3wnr3vkmr297zm53smw8j4efevpknuwm8vs5yqdq5w35hqurfdenjq6nsdamscqzpuxqyz5vqsp5yzmznk5z7xszkgfk5xstuh8j5gg4srerelv58pph5wjan2kd8rqs9qyyssqe5l376x893374kqsr5lc8tesudg4jryaqlzmx44mfr87nds83margfa09ggd92sy0rudl6r79sat4rxqml5yfdhmm7yk9jc0ugzw7hgpdfxfzk",
                "paymentHash": "298be57216d8dfda8e2e88e2cb6c6a2f85ba461b71e55ca72c0da7c76cec8508",
                "paymentSecret": "20b629da82f1a02b2136a1a0be5cf2a211580f23cfd8438437a3a5d9aacd38c1",
                "satoshis": 12345
            }
        }
    }
}
```

### lnInvoiceFeeProbe

#### query
```bash
export PAYMENT_REQUEST='lntb123450n1pscxulepp59x872uskmr0a4r3wnr3vkmr297zm53smw8j4efevpknuwm8vs5yqdq5w35hqurfdenjq6nsdamscqzpuxqyz5vqsp5yzmznk5z7xszkgfk5xstuh8j5gg4srerelv58pph5wjan2kd8rqs9qyyssqe5l376x893374kqsr5lc8tesudg4jryaqlzmx44mfr87nds83margfa09ggd92sy0rudl6r79sat4rxqml5yfdhmm7yk9jc0ugzw7hgpdfxfzk'
curl --location --request POST $URI --header "$AUTH_TOKEN" --header 'Content-Type: application/json' --data-raw '{"query":"mutation lnInvoiceFeeProbe ($input: LnInvoiceFeeProbeInput!) {\n    lnInvoiceFeeProbe (input: $input) {\n        errors {\n            message\n            path\n        }\n        amount\n    }\n}","variables":{"input":{"paymentRequest":"'"$PAYMENT_REQUEST"'"}}}'
```

#### response
```json
{
    "data": {
        "lnInvoiceFeeProbe": {
            "errors": [],
            "amount": 0
        }
    }
}
```


### lnInvoicePaymentSend

#### query
```bash
PAYMENT_REQUEST='lntb50u1psc8xeppp5yryt4j8ve0pvyunrp3dr0l5tj0ss4hnkuxz52hldc9nz2njpe2fqdqqxqrrss9qy9qsqsp5xduj0a8u2c7mn959045wnu8xrv63vqye2d2zw3kllahdv47np6qsrzjqwfn3p9278ttzzpe0e00uhyxhned3j5d9acqak5emwfpflp8z2cng85uzyqqqdsqqqqqqqlgqqqqqeqqjqjwcuu47akd6qggafxy403zk9f67xh86huv6r0fkngvkuwrxuadv8dd3u5gfeurshh3q6jr5jvu05z7f63xz5ac8v4pk3tjfv46jt5dcprr9d4z'
curl --location --request POST $URI --header "$AUTH_TOKEN" --header 'Content-Type: application/json' --data-raw '{"query":"mutation lnInvoicePaymentSend ($input: LnInvoicePaymentInput!) {\n    lnInvoicePaymentSend (input: $input) {\n        errors {\n            message\n            path\n        }\n        status\n    }\n}","variables":{"input":{"paymentRequest":"'"$PAYMENT_REQUEST"'","memo":"'"$MEMO"'"}}}'
```

#### response
```json
{
    "data": {
        "lnInvoicePaymentSend": {
            "errors": [],
            "status": "ALREADY_PAID"
        }
    }
}
```

## Extra Resources

If you use Postman, we have a collection you can import to test the API.

Download it here: [galoy_graphql_main_api.postman_collection.json](https://github.com/GaloyMoney/galoy/tree/main/src/graphql/docs/galoy_graphql_main_api.postman_collection.json)
