BIN_DIR=node_modules/.bin

start-deps:
	docker compose up integration-deps -d
	direnv reload

start:
	. ./.envrc && yarn tsnd --respawn --files -r tsconfig-paths/register -r src/services/tracing.ts \
		src/servers/graphql-main-server.ts | yarn pino-pretty -c -l

start-admin:
	. ./.envrc && yarn tsnd --respawn --files -r tsconfig-paths/register -r src/services/tracing.ts \
		src/servers/graphql-admin-server.ts | yarn pino-pretty -c -l

start: start-deps
	make start & make start-admin & make trigger

trigger: start-deps
	. ./.envrc && yarn tsnd --respawn --files -r tsconfig-paths/register -r src/services/tracing.ts \
		src/servers/trigger.ts | yarn pino-pretty -c -l

start-api-ci:
	node lib/servers/graphql-main-server.js

exporter: start-deps
	. ./.envrc && yarn tsnd --respawn --files -r tsconfig-paths/register -r src/services/tracing.ts \
		src/servers/exporter.ts | yarn pino-pretty -c -l

watch:
	yarn nodemon -V -e ts,graphql -w ./src -x make start

clean-deps:
	docker compose down

reset-deps: clean-deps start-deps

test: unit integration

test-migrate:
	docker compose down -v
	docker compose build
	docker compose up mongodb-migrate

unit:
	yarn test:unit

watch-unit:
	$(BIN_DIR)/jest --clearCache
	NODE_ENV=test LOGLEVEL=warn $(BIN_DIR)/jest --watch --config ./test/jest-unit.config.js

watch-compile:
	$(BIN_DIR)/tsc --watch  --noEmit --skipLibCheck

integration:
	yarn build && \
	yarn test:integration

reset-integration: reset-deps integration

integration-in-ci:
	. ./.envrc && \
	yarn build && \
	NODE_ENV=test LOGLEVEL=error $(BIN_DIR)/jest --config ./test/jest-integration.config.js --bail --runInBand --ci --reporters=default --reporters=jest-junit && \
	LOGLEVEL=error node lib/servers/cron.js

unit-in-ci:
	. ./.envrc && \
		LOGLEVEL=warn $(BIN_DIR)/jest --config ./test/jest-unit.config.js --ci --bail

check-code:
	yarn tsc-check
	yarn eslint-check
	yarn build
