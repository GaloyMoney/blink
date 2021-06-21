start-deps:
	docker-compose up -d
	direnv reload

clean-deps:
	docker-compose rm -sfv

reset-deps: clean-deps start-deps

integration:
	yarn jest --forceExit --bail --runInBand --verbose $$TEST | yarn pino-pretty -c -l

test-in-ci:
	node_modules/.bin/jest --ci --bail --runInBand --reporters=default --reporters=jest-junit --forceExit

check-code:
	yarn tsc-check
	yarn eslint-check
