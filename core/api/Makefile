BIN_DIR=node_modules/.bin

test-migrate:
	docker compose down -v -t 3
	docker compose build
	docker compose -f docker-compose.yml up mongodb-migrate --exit-code-from mongodb-migrate

create-tmp-env-ci:
	. ./.env && \
	envsubst < ./.env.ci > tmp.env.ci
