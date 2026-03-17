# Rebuilds the `api` container image `novu-api` from source, and restarts it with the changes.

# Must be ran from project root

# build the TS first
pnpm run x-build:application-generic && pnpm run x-build:api

# build the Docker image with no cache
cd apps/api
pnpm --silent --workspace-root pnpm-context -- apps/api/Dockerfile | docker buildx build --no-cache -t novu-api --build-arg PACKAGE_PATH=apps/api -

# restart just the API container
cd /home/ec2-user/novu/docker/local/deployment
docker compose up -d --force-recreate api
