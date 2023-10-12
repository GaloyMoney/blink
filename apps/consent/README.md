## Overview

This application facilitates users to sign in using OAuth 2.0 via their blink account credentials, similar to signing in via Google or GitHub on other platforms. It also enables the definition of scopes, which represent the permissions the application requires, such as reading account details or initiating payments. This application is built on top of Hydra.




## Local set up:
Install dependencies using
```
  yarn install
```

Run next.js app in dev mode
```bash
  npm run dev
  # or
  yarn dev
  # or
  pnpm dev
```

###Environment variables
```
  CORE_AUTH_URL
  HYDRA_ADMIN_URL
```
