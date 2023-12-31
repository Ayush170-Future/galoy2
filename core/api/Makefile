BIN_DIR=node_modules/.bin

start-deps:
	docker compose -f ./docker-compose.yml up bats-deps -d

start-deps-integration:
	docker compose -f ./docker-compose.yml up integration-deps -d

update-price-history:
	docker compose run price-history node servers/history/cron.js

start-main:
	. ./.env && pnpm tsnd --respawn --files -r tsconfig-paths/register -r src/services/tracing.ts \
		src/servers/graphql-main-server.ts | pnpm pino-pretty -c -l

start-main-fast:
	pnpm run watch-main | pnpm pino-pretty -c -l

start-trigger:
	. ./.env && pnpm tsnd --respawn --files -r tsconfig-paths/register -r src/services/tracing.ts \
		src/servers/trigger.ts | pnpm pino-pretty -c -l

start-cron: start-deps
	. ./.env && pnpm tsnd --files -r tsconfig-paths/register -r src/services/tracing.ts \
		src/servers/cron.ts | pnpm pino-pretty -c -l

start-ws:
	. ./.env && pnpm tsnd --respawn --files -r tsconfig-paths/register -r src/services/tracing.ts \
		src/servers/ws-server.ts | pnpm pino-pretty -c -l

start-loopd:
	./dev/bin/start-loopd.sh

start: start-deps
	make start-main & make start-trigger & make start-ws

start-main-ci:
	node dist/servers/graphql-main-server.js

start-trigger-ci:
	node dist/servers/trigger.js

start-ws-ci:
	node dist/servers/ws-server.js

exporter: start-deps
	. ./.env && pnpm tsnd --respawn --files -r tsconfig-paths/register -r src/services/tracing.ts \
		src/servers/exporter.ts | pnpm pino-pretty -c -l

watch:
	pnpm nodemon -V -e ts,graphql -w ./src -x make start

clean-deps:
	docker compose down -t 3

reset-deps: clean-deps start-deps
reset-deps-integration: clean-deps start-deps-integration

test: unit legacy-integration integration

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

legacy-integration:
	pnpm run build && \
	pnpm run test:legacy-integration

reset-legacy-integration: reset-deps-integration legacy-integration

integration:
	pnpm run build && \
	. ./.env && pnpm run test:integration

reset-integration: reset-deps-integration integration

reset-all-integration: reset-deps-integration legacy-integration integration

bats:
	pnpm run build && \
	. ./.env && bats -t test/bats

reset-bats: reset-deps bats

bats-in-ci:
	pnpm install --frozen-lockfile && \
	$(MAKE) reset-bats

integration-in-ci:
	pnpm install --frozen-lockfile && \
	export NODE_OPTIONS="--max-old-space-size=6144" && \
	$(MAKE) reset-all-integration

legacy-integration-in-ci:
	pnpm install --frozen-lockfile && \
	export NODE_OPTIONS="--max-old-space-size=6144" && \
	$(MAKE) reset-legacy-integration

unit-in-ci:
	. ./.env && \
		LOGLEVEL=warn $(BIN_DIR)/jest --config ./test/unit/jest.config.js --ci --bail --maxWorkers=50%

create-tmp-env-ci:
	. ./.env && \
	envsubst < ./.env.ci > tmp.env.ci

mine-block:
	container_id=$$(docker ps -q -f status=running -f name="bitcoind-1"); \
	docker exec -it "$$container_id" /bin/sh -c 'bitcoin-cli createwallet -chain=regtest || ADDR=$$(bitcoin-cli getnewaddress "") && bitcoin-cli generatetoaddress 6 $$ADDR '

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

codegen:
	pnpm run write-sdl

gen-test-jwt:
	pnpm run gen-test-jwt
