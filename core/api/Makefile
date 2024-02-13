BIN_DIR=node_modules/.bin

start-deps:
	docker compose -f ./docker-compose.yml up bats-deps -d

update-price-history:
	docker compose run price-history node servers/history/cron.js

start-main:
	. ./.env && pnpm tsnd --respawn --files -r tsconfig-paths/register -r src/services/tracing.ts \
		src/servers/graphql-main-server.ts | pnpm pino-pretty -c -l

start-main-fast:
	pnpm run watch-main | pnpm pino-pretty -c -l

start: start-deps
	make start-main

start-main-ci:
	node dist/servers/graphql-main-server.js

watch:
	pnpm nodemon -V -e ts,graphql -w ./src -x make start

test: unit integration

test-migrate:
	docker compose down -v -t 3
	docker compose build
	docker compose -f docker-compose.yml up mongodb-migrate --exit-code-from mongodb-migrate

unit:
	pnpm run test:unit

watch-unit:
	$(BIN_DIR)/jest --config ./test/unit/jest.config.js --clearCache
	NODE_ENV=test LOGLEVEL=warn $(BIN_DIR)/jest --watch --config ./test/unit/jest.config.js

del-containers:
	docker compose rm -sfv

integration:
	pnpm run build && \
	. ./.env && pnpm run test:integration

create-tmp-env-ci:
	. ./.env && \
	envsubst < ./.env.ci > tmp.env.ci

mine-block:
	container_id=$$(docker ps -q -f status=running -f name="bitcoind-1"); \
	docker exec -it "$$container_id" /bin/sh -c 'bitcoin-cli createwallet -chain=regtest || ADDR=$$(bitcoin-cli getnewaddress "") && bitcoin-cli generatetoaddress 3 $$ADDR '
	docker exec -it "$$container_id" /bin/sh -c 'bitcoin-cli createwallet -chain=regtest || ADDR=$$(bitcoin-cli getnewaddress "") && bitcoin-cli generatetoaddress 3 $$ADDR '

lncli-1:
	docker exec -it $$(docker ps -q -f status=running -f name="lnd1-1") /bin/sh -c 'lncli -n regtest ${command}'

# to pay an invoice: make lncli-outside-1 command="payinvoice lnbcrt1... --amt=100 -f"
lncli-outside-1:
	docker exec -it $$(docker ps -q -f status=running -f name="lnd-outside-1-1") /bin/sh -c 'lncli -n regtest ${command}'

kill-graphql:
	kill $$(lsof -t -i:4001) & kill $$(lsof -t -i:4012) & kill $$(lsof -t -i:4000) & kill $$(lsof -t -i:8888)

redis-cli:
	docker-compose exec redis redis-cli

redis-flush:
	docker-compose exec redis redis-cli FLUSHDB

gen-test-jwt:
	pnpm run gen-test-jwt

boltcard:
	bun run ./apps/boltcard/index.ts
