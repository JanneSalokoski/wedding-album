# Production:

prod:
	docker compose -f docker-compose.prod.yml up -d --build

prod-build:
	docker compose -f docker-compose.prod.yml build

prod-up:
	docker compose -f docker-compose.prod.yml up -d

prod-down:
	docker compose -f docker-compose.prod.yml down

prod-clean:
	docker compose -f docker-compose.prod.yml down -v

# Development

dev:
	docker compose up --build

dev-build:
	docker compose build

dev-up:
	docker compose up -d

dev-down:
	docker compose down

dev-clean:
	docker compose down -v
