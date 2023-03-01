Enable Email Auth Locally
========================
If new instance run:
```
make reset-deps
make reset-integration
KRATOS_YAML_FILE="email/kratos.email.yml" make reset-e2e
```

If existing running instance:
1. Delete the docker containers (and volume) `kratos` and `kratos-pg`
```
docker stop galoy-kratos-1 && docker rm -v galoy-kratos-1
docker stop galoy-kratos-pg-1 && docker rm -v galoy-kratos-pg-1
```
2. Reset the e2e tests with auth
```
KRATOS_YAML_FILE="email/kratos.email.yml" TEST="with-auth" make reset-e2e
```

To switch back to using phone+code:
1. Delete the docker containers (and volume) `kratos` and `kratos-pg`
```
docker stop galoy-kratos-1 && docker rm -v galoy-kratos-1
docker stop galoy-kratos-pg-1 && docker rm -v galoy-kratos-pg-1
```
2. Reset the e2e tests with auth
```
TEST="with-auth" make reset-e2e
```

To Test Email Auth
-----------------
1. `make start-main-fast`
2. You can test in a web browser dev tools. I usually test on http://localhost:4002/graphql dev tools console
```
var myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");
var raw = JSON.stringify({
  "email": "email11@email.com",
  "password": "password_dsnfi348"
});
var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: raw,
  redirect: 'follow',
};
fetch("http://localhost:4002/auth/login/email", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
```
3. Notice that now you have `ory_kratos_session` and `csrf_token` cookies

To Test phone+code login
-----------------
```
var myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");
var raw = JSON.stringify({
  "phoneNumber": "+16505554321",
  "authCode": "321321"
});
var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: raw,
  redirect: 'follow',
};
fetch("http://localhost:4002/auth/login", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));
```
