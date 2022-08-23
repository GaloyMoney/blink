# Account custom fields

This document shows you how to setup account custom fields for your galoy instance.

## Configuration

```
customFields:
  - name: "customFieldName"
    type: <"string" | "integer" | "float" | "boolean"> # optional (default: "string")
    defaultValue: <value> # optional
    editable: <true | false> # optional (default: false) - true if field can be updated by the user
    required: <true | false> # optional (default: false) - true if field is required by mutations
    index: <true | false> # optional (default: false) - true if field should have an index in db
```

## Example

Add the next configuration to `default.yaml`
```
accounts:
  ...
  customFields:
    - name: "nationalId"
      type: "integer"
      defaultValue: 0
    - name: "firstName"
      type: "string"
      required: true
      editable: true
    - name: "lastName"
      type: "string"
      editable: true
    - name: "terms"
      type: "boolean"
      editable: true
      defaultValue: false
```

If customFields config is empty then all related mutations and queries should not be visible by API clients.

### Update values as an user

In the main server playground (`make start-main`) run the next:

```
mutation AccountCustomFieldsUpdate($input: AccountCustomFieldsUpdateInput!) {
  accountCustomFieldsUpdate(input: $input) {
    errors {
      message
    }
    accountCustomFields {
      firstName
      lastName
      terms
    }
  }
}
```
Input
```
{"input": {  "firstName": "Satoshi", "lastName": "Nakamoto", "terms": true } }
```

Note: please notice that `nationalId` can only be updated as an editor (admin API)

### Query values as an user

```
query me {
  me {
    defaultAccount {
      defaultWalletId
      wallets {
        id
        walletCurrency
      }
      customFields {
        firstName
        lastName
        terms
      }
    }
  }
}
```

Note: please notice that `nationalId` is only visible as an editor (admin API)

### Update values as an editor

In the admin server playground (`make start-admin`) as an editor run the next:

```
mutation AccountCustomFieldsUpdate($input: AccountCustomFieldsUpdateInput!) {
  accountCustomFieldsUpdate(input: $input) {
    errors {
      message
    }
    accountCustomFields {
      nationalId
      firstName
      lastName
      terms
    }
  }
}
```
Input
```
{"input": {  "accountId": "<accountId from db>", "nationalId": 212121, "firstName": "Satoshi", "lastName": "Nakamoto", "terms": true } }
```

### Query values as an editor

```
query getAccountDetailsByUserPhone($phone: Phone!) {
  accountDetails: accountDetailsByUserPhone(phone: $phone) {
    id
    customFields {
      nationalId
      firstName
      lastName
      terms
    }
    createdAt
  }
}
```

Input (updated user's phone)
```
{"phone": "+16505554322"}
```

```
query getAccountDetailsByUsername($username: Username!) {
  accountDetails: accountDetailsByUsername(username: $username) {
    id
    customFields {
      nationalId
      firstName
      lastName
      terms
    }
    createdAt
  }
}
```

Input (updated user's username)
```
{"username": "userB"}
```

### Search accounts by custom field as an editor

```
query AccountsDetailsByCustomField($field: CustomField, $value: String!) {
  accountsDetails: accountsDetailsByCustomField(field: $field, value: $value) {
    id
    username
    customFields {
      nationalId
      firstName
      lastName
      terms
    }
    createdAt
  }
}
```

Input
```
{ "field": "nationalId", "value": "212"}
or
{ "field": "firstName", "value": "sato"}
```

Note: field is validated similar to the price query, only valid field names are valid values
