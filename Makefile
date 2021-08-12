BIN_DIR=node_modules/.bin

start-deps:
	docker-compose up -d
	direnv reload

start-old:
	. ./.envrc && yarn tsnd --respawn --files -r tsconfig-paths/register src/servers/graphql-old-server.ts | yarn pino-pretty -c -l

start-new:
	. ./.envrc && yarn tsnd --respawn --files -r tsconfig-paths/register src/servers/graphql-main-server.ts | yarn pino-pretty -c -l

start-admin:
	. ./.envrc && yarn tsnd --respawn --files -r tsconfig-paths/register src/servers/graphql-admin-server.ts | yarn pino-pretty -c -l

start: start-deps
	make start-old & make start-new & make start-admin

watch:
	yarn nodemon -V -e ts,graphql -w ./src -x make start

clean-deps:
	docker-compose down

reset-deps: clean-deps start-deps

test: unit integration

unit:
	yarn test:unit

watch-unit:
	$(BIN_DIR)/jest --clearCache
	NODE_ENV=test LOGLEVEL=warn $(BIN_DIR)/jest --watch --config ./test/jest-unit.config.js

watch-check:
	$(BIN_DIR)/tsc --watch  -p tsconfig-build.json --noEmit --skipLibCheck

integration:
	yarn test:integration

reset-integration: reset-deps integration

integration-in-ci:
	. ./.envrc && \
		LOGLEVEL=error $(BIN_DIR)/jest --config ./test/jest-integration.config.js --bail --runInBand --ci --reporters=default --reporters=jest-junit

check-code:
	yarn tsc-check
	yarn eslint-check
	yarn prettier-check
	yarn build
