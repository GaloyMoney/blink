BIN_DIR=node_modules/.bin

start-deps:
	docker compose up integration-deps -d

update-price-history:
	docker compose run price-history node servers/history/cron.js

start-okex:
	. ./.envrc && yarn tsnd --respawn --files -r tsconfig-paths/register \
		test/mocks/okex-server.ts | yarn pino-pretty -c -l

start-main-only:
	. ./.envrc && yarn tsnd --respawn --files -r tsconfig-paths/register -r src/services/tracing.ts \
		src/servers/graphql-main-server.ts | yarn pino-pretty -c -l

start-main:
	make start-okex & make start-main-only

start-main-fast:
	yarn run watch-main | yarn pino-pretty -c -l

start-admin-only:
	. ./.envrc && yarn tsnd --respawn --files -r tsconfig-paths/register -r src/services/tracing.ts \
		src/servers/graphql-admin-server.ts | yarn pino-pretty -c -l

start-admin:
	make start-okex & make start-admin-only

start-trigger: start-deps
	. ./.envrc && yarn tsnd --respawn --files -r tsconfig-paths/register -r src/services/tracing.ts \
		src/servers/trigger.ts | yarn pino-pretty -c -l

start-cron: start-deps
	. ./.envrc && yarn tsnd --files -r tsconfig-paths/register -r src/services/tracing.ts \
		src/servers/cron.ts | yarn pino-pretty -c -l

start-loopd:
	./dev/bin/start-loopd.sh

start: start-deps
	make start-okex & make start-main-only & make start-admin-only & make start-trigger

start-main-ci:
	node lib/servers/graphql-main-server.js

start-trigger-ci:
	node lib/servers/trigger.js

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
	docker compose -f docker-compose.yml up mongodb-migrate --exit-code-from mongodb-migrate

unit:
	yarn test:unit

watch-unit:
	$(BIN_DIR)/jest --config ./test/jest-unit.config.js --clearCache
	NODE_ENV=test LOGLEVEL=warn $(BIN_DIR)/jest --watch --config ./test/jest-unit.config.js

watch-compile:
	$(BIN_DIR)/tsc --watch  --noEmit --skipLibCheck

e2e-in-ci:
	make create-tmp-env-ci && \
	TMP_ENV_CI=tmp.env.ci docker compose -f docker-compose.yml up e2e-tests

reset-e2e-in-ci-with-build: reset-deps e2e-in-ci-with-build

e2e-in-ci-with-build:
	yarn build && \
	make create-tmp-env-ci && \
	TMP_ENV_CI=tmp.env.ci docker compose -f docker-compose.yml run --name e2e-tests e2e-tests make execute-e2e-from-within-container-cached || \
	docker rm `docker ps -q -f status=exited`

e2e-in-ci-cached:
	make create-tmp-env-ci && \
	TMP_ENV_CI=tmp.env.ci docker compose -f docker-compose.yml run --name e2e-tests e2e-tests make execute-e2e-from-within-container-cached || \
	docker rm `docker ps -q -f status=exited`

delete-e2e:
	docker container kill `docker ps -f name="e2e-tests" -q` && \
	sleep 1 && \
	docker container rm `docker ps -f name="e2e-tests" -q`

main-in-ci-build:
	yarn build && \
	make create-tmp-env-ci && \
	TMP_ENV_CI=tmp.env.ci docker compose -f docker-compose.yml run --name e2e-tests e2e-tests make start-main-ci || \
	make del-containers

main-in-ci-cached:
	make create-tmp-env-ci && \
	TMP_ENV_CI=tmp.env.ci docker compose -f docker-compose.yml run --name e2e-tests e2e-tests make start-main-ci || \
	make del-containers

main-in-ci-cached-no-restart:
	make create-tmp-env-ci && \
	TMP_ENV_CI=tmp.env.ci docker compose run --name e2e-tests e2e-tests make start-main-ci || \
	make del-containers

del-containers:
	docker compose rm -sfv

execute-e2e-from-within-container:
	yarn install && \
	yarn build && \
	NODE_ENV=test LOGLEVEL=error $(BIN_DIR)/jest --config ./test/jest-e2e.config.js --bail --runInBand --ci --reporters=default --reporters=jest-junit

execute-e2e-from-within-container-cached:
	NODE_ENV=test LOGLEVEL=error $(BIN_DIR)/jest with-auth --config ./test/jest-e2e.config.js --bail --runInBand --ci --reporters=default --reporters=jest-junit 

integration:
	yarn build && \
	yarn test:integration

reset-integration: reset-deps integration

e2e:
	yarn build && \
	yarn test:e2e

reset-e2e: reset-deps e2e

integration-in-ci-cached:
	yarn build && \
	make create-tmp-env-ci && \
	TMP_ENV_CI=tmp.env.ci docker compose -f docker-compose.yml up integration-tests-cached

integration-in-ci:
	make create-tmp-env-ci && \
	TMP_ENV_CI=tmp.env.ci docker compose -f docker-compose.yml up integration-tests

# NODE_OPTIONS line should be removed whenever we upgrade yarn.lock to see if
# heap allocation issue has been resolved in dependencies (fails at 2048).
execute-integration-from-within-container:
	yarn install && \
	NODE_OPTIONS="--max-old-space-size=4096" \
	NODE_ENV=test LOGLEVEL=error $(BIN_DIR)/jest --config ./test/jest-integration.config.js --bail --runInBand --ci --reporters=default --reporters=jest-junit

execute-integration-from-within-container-cached:
	NODE_OPTIONS="--max-old-space-size=3072" \
	NODE_ENV=test LOGLEVEL=error $(BIN_DIR)/jest --config ./test/jest-integration.config.js --bail --runInBand --ci --reporters=default --reporters=jest-junit 

unit-in-ci:
	. ./.envrc && \
		LOGLEVEL=warn $(BIN_DIR)/jest --config ./test/jest-unit.config.js --ci --bail

check-implicit:
	yarn tsc-check-noimplicitany

check-code: check-implicit
	yarn tsc-check
	yarn eslint-check
	yarn build
	yarn check-yaml

create-tmp-env-ci:
	. ./.envrc && \
	envsubst < .env.ci > tmp.env.ci

# 16 is exit code for critical https://classic.yarnpkg.com/lang/en/docs/cli/audit
audit:
	bash -c 'yarn audit --level critical; [[ $$? -ge 16 ]] && exit 1 || exit 0'

mine-block:
	container_id=$$(docker ps -q -f status=running -f name="bitcoind"); \
	docker exec -it "$$container_id" /bin/sh -c 'ADDR=$$(bitcoin-cli getnewaddress "") && bitcoin-cli generatetoaddress 6 $$ADDR '
