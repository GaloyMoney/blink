BIN_DIR=node_modules/.bin

start-deps:
	docker compose up -d
	until docker exec postgres_ln_service pg_isready; do sleep 1; done
	yarn run db:migrate

clean-deps:
	docker compose down

reset-deps: clean-deps start-deps

start-dev: reset-deps
	yarn run dev

check-code:
	yarn lint
	yarn build

unit-test:
	yarn test:unit

e2e-test:
	start-dev
	yarn test:e2e