#!/bin/sh

node_modules/.bin/migrate-mongo status -f src/migrations/migrate-mongo-config.js
node_modules/.bin/migrate-mongo up -f src/migrations/migrate-mongo-config.js
node_modules/.bin/migrate-mongo status -f src/migrations/migrate-mongo-config.js
