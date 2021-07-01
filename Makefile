start-deps:
	docker-compose up -d
	direnv reload

start: start-deps
	. ./.envrc && yarn build && node lib/entrypoint/graphql.js | yarn pino-pretty -c -l

watch:
	yarn nodemon -V -e ts,graphql -w ./src -x make start

clean-deps:
	docker-compose rm -sfv

reset-deps: clean-deps start-deps

integration:
	. ./.envrc && yarn jest --forceExit --bail --runInBand --verbose $$TEST | yarn pino-pretty -c -l

restart-integration: reset-deps integration

test-in-ci:
	docker-compose up -d
	. ./.envrc && \
		node_modules/.bin/jest --bail --runInBand --ci --reporters=default --reporters=jest-junit --forceExit

check-code:
	yarn tsc-check
	yarn eslint-check
	yarn prettier-check
	yarn build
