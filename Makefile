start-deps:
	docker-compose up -d
	direnv reload

start: start-deps
	. ./.envrc && yarn tsnd --respawn src/entrypoint/graphql.ts | yarn pino-pretty -c -l

watch:
	yarn nodemon -V -e ts,graphql -w ./src -x make start

clean-deps:
	docker-compose rm -sfv

reset-deps: clean-deps start-deps

test: unit integration

unit:
	yarn test:unit

integration:
	yarn test:integration

reset-integration: reset-deps integration

test-in-ci:
	docker-compose up -d
	. ./.envrc && \
		LOGLEVEL=error node_modules/.bin/jest --bail --runInBand --ci --reporters=default --reporters=jest-junit

check-code:
	yarn tsc-check
	yarn eslint-check
	yarn prettier-check
	yarn build
