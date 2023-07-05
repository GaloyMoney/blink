BIN_DIR=node_modules/.bin

start-deps:
	docker compose up e2e-deps -d

start-deps-integration:
	docker compose up integration-deps -d

start-deps-bats:
	docker compose up bats-deps -d

update-price-history:
	docker compose run price-history node servers/history/cron.js

start-main:
	. ./.envrc && yarn tsnd --respawn --files -r tsconfig-paths/register -r src/services/tracing.ts \
		src/servers/graphql-main-server.ts | yarn pino-pretty -c -l

start-main-fast:
	yarn run watch-main | yarn pino-pretty -c -l

start-trigger:
	. ./.envrc && yarn tsnd --respawn --files -r tsconfig-paths/register -r src/services/tracing.ts \
		src/servers/trigger.ts | yarn pino-pretty -c -l

start-cron: start-deps
	. ./.envrc && yarn tsnd --files -r tsconfig-paths/register -r src/services/tracing.ts \
		src/servers/cron.ts | yarn pino-pretty -c -l

start-ws:
	. ./.envrc && yarn tsnd --respawn --files -r tsconfig-paths/register -r src/services/tracing.ts \
		src/servers/ws-server.ts | yarn pino-pretty -c -l

start-loopd:
	./dev/bin/start-loopd.sh

start: start-deps
	make start-main & make start-trigger & make start-ws

start-main-ci:
	node lib/servers/graphql-main-server.js

start-trigger-ci:
	node lib/servers/trigger.js

start-ws-ci:
	node lib/servers/ws-server.js

exporter: start-deps
	. ./.envrc && yarn tsnd --respawn --files -r tsconfig-paths/register -r src/services/tracing.ts \
		src/servers/exporter.ts | yarn pino-pretty -c -l

watch:
	yarn nodemon -V -e ts,graphql -w ./src -x make start

clean-deps:
	docker compose down -t 3

reset-deps: clean-deps start-deps
reset-deps-integration: clean-deps start-deps-integration
reset-deps-bats: clean-deps start-deps-bats

test: unit legacy-integration integration

test-migrate:
	docker compose down -v -t 3
	docker compose build
	docker compose -f docker-compose.yml up mongodb-migrate --exit-code-from mongodb-migrate

unit:
	yarn test:unit

watch-unit:
	$(BIN_DIR)/jest --config ./test/unit/jest.config.js --clearCache
	NODE_ENV=test LOGLEVEL=warn $(BIN_DIR)/jest --watch --config ./test/unit/jest.config.js

watch-compile:
	$(BIN_DIR)/tsc --watch  --noEmit

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
	TMP_ENV_CI=tmp.env.ci docker compose -f docker-compose.yml -f docker-compose.override.yml run --name e2e-tests e2e-tests make start-main-ci || \
	docker rm e2e-tests

main-in-ci-cached:
	make create-tmp-env-ci && \
	TMP_ENV_CI=tmp.env.ci docker compose -f docker-compose.yml run --name e2e-tests e2e-tests make start-main-ci || \
	docker rm e2e-tests

del-containers:
	docker compose rm -sfv

execute-e2e-from-within-container:
	yarn install && \
	yarn build && \
	NODE_ENV=test LOGLEVEL=error $(BIN_DIR)/jest --config ./test/e2e/jest.config.js --bail --runInBand --ci --reporters=default --reporters=jest-junit

execute-e2e-from-within-container-cached:
	NODE_ENV=test LOGLEVEL=error $(BIN_DIR)/jest --config ./test/e2e/jest.config.js --bail --runInBand --ci --reporters=default --reporters=jest-junit

legacy-integration:
	yarn build && \
	yarn test:legacy-integration

reset-legacy-integration: reset-deps-integration legacy-integration

integration:
	yarn test:integration

reset-integration: reset-deps-integration integration

e2e:
	yarn build && \
	yarn test:e2e

reset-e2e: reset-deps e2e

bats:
	yarn build && \
	bats -t test/bats

reset-bats: reset-deps-bats bats

integration-in-ci:
	make create-tmp-env-ci && \
	TMP_ENV_CI=tmp.env.ci docker compose -f docker-compose.yml up integration-tests

# NODE_OPTIONS line should be removed whenever we upgrade yarn.lock to see if
# heap allocation issue has been resolved in dependencies (fails at 2048).
execute-integration-from-within-container:
	yarn install && \
	NODE_OPTIONS="--max-old-space-size=6144" \
	NODE_ENV=test LOGLEVEL=error $(BIN_DIR)/jest --config ./test/legacy-integration/jest.config.js --bail --runInBand --ci --reporters=default --reporters=jest-junit && \
	NODE_OPTIONS="--max-old-space-size=6144" \
	NODE_ENV=test LOGLEVEL=error $(BIN_DIR)/jest --config ./test/integration/jest.config.js --bail --runInBand --ci --reporters=default --reporters=jest-junit

unit-in-ci:
	. ./.envrc && \
		LOGLEVEL=warn $(BIN_DIR)/jest --config ./test/unit/jest.config.js --ci --bail --maxWorkers=50%

check-implicit:
	yarn tsc-check-noimplicitany

check-code: check-implicit
	yarn tsc-check
	yarn eslint-check
	yarn build
	yarn check-yaml
	yarn madge-check

create-tmp-env-ci:
	. ./.envrc && \
	envsubst < .env.ci > tmp.env.ci

# 16 is exit code for critical https://classic.yarnpkg.com/lang/en/docs/cli/audit
audit:
	bash -c 'yarn audit --level critical; [[ $$? -ge 16 ]] && exit 1 || exit 0'

mine-block:
	container_id=$$(docker ps -q -f status=running -f name="bitcoind"); \
	docker exec -it "$$container_id" /bin/sh -c 'ADDR=$$(bitcoin-cli getnewaddress "") && bitcoin-cli generatetoaddress 6 $$ADDR '

lncli-1:
	docker exec -it $$(docker ps -q -f status=running -f name="lnd1-1") /bin/sh -c 'lncli -n regtest ${command}'

# to pay an invoice: make lncli-outside-1 command="payinvoice lnbcrt1... --amt=100 -f"
lncli-outside-1:
	docker exec -it $$(docker ps -q -f status=running -f name="lnd-outside-1-1") /bin/sh -c 'lncli -n regtest ${command}'

kill-graphql:
	kill $$(lsof -t -i:4001) & kill $$(lsof -t -i:4012) & kill $$(lsof -t -i:4000) & kill $$(lsof -t -i:8888)

redis-cli:
	docker-compose exec redis redis-cli

e2e-codegen:
	yarn e2e-codegen

gen-test-jwt:
	yarn gen-test-jwt

reset-sleep-e2e:
	make reset-deps
	sleep 10
	make e2e
