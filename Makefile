start-deps:
	docker-compose up -d
	direnv reload

clean-deps:
	docker-compose rm -sfv

reset-deps: clean-deps start-deps

integration:
	yarn jest --forceExit --bail --runInBand --verbose $$TEST | yarn pino-pretty -c -l

test-in-ci:
	docker-compose up -d
	sleep 5
	. ./.envrc && \
		node_modules/.bin/jest --bail --runInBand --ci --reporters=default --reporters=jest-junit --forceExit

check-code:
	yarn tsc-check
	yarn eslint-check
	yarn prettier-check
