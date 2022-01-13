#!/bin/sh

node_modules/.bin/migrate-mongodb status -f src/migrations/migrate-mongo-config.js
node_modules/.bin/migrate-mongodb up -f src/migrations/migrate-mongo-config.js
node_modules/.bin/migrate-mongodb status -f src/migrations/migrate-mongo-config.js
