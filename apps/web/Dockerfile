# start build stage
FROM nikolaik/python-nodejs:python3.10-nodejs16-alpine as builder
ENV NX_DAEMON=false

RUN echo $NX_DAEMON
RUN sleep 2

WORKDIR /usr/src/app

RUN apk add --no-cache bash
RUN npm install -g pnpm@7.33.4 --loglevel notice

COPY .npmrc .
COPY package.json .

COPY apps/web ./apps/web
COPY libs/dal ./libs/dal
COPY libs/testing ./libs/testing
COPY packages/client ./packages/client
COPY libs/shared ./libs/shared
COPY packages/notification-center ./packages/notification-center
COPY packages/stateless ./packages/stateless
COPY packages/node ./packages/node

COPY tsconfig.json .
COPY tsconfig.base.json .

COPY nx.json .
COPY pnpm-workspace.yaml .
COPY pnpm-lock.yaml .

# RUN --mount=type=cache,id=pnpm-store-web,target=/root/.pnpm-store\
RUN echo 'Skipping the RUN --mount=type=cache, because it seems to hang/break the build every time.\n As it turns out, there is no speed benefit to caching if the caching attempt causes the build to hang indefinitely.'

CMD ["sleep", "infinity"]
# Currently, the steps of `pnpm install` and `cd ./apps/web && npm run start:static:build:http-only`
# are being ran inside the container manually, due to a tendency for the automatic version 
# of this install to freeze.

# RUN pnpm install || echo "ok, apparently pnpm install failed"

# RUN cd /usr/src/app/apps/web 

# CMD ["npm", "run", "start:dev"]

# TODO - fix this once the Novu webapp issue can be resolved.

# RUN pnpm install || echo "ok, apparently pnpm install failed"
# --reporter=silent

# RUN pnpm add @babel/core -w

# COPY [".eslintrc.js",".prettierrc",".prettierignore", "./"]
# CMD ["sleep", "infinity"]


#  I will try to run these in the container, at this point.

# RUN NX_DAEMON=false pnpm build:web
# end build stage

# start production stage
# FROM node:16-alpine

# WORKDIR /app

# RUN apk add --no-cache bash
# RUN npm install -g pnpm@7.33.4 http-server --loglevel notice

# COPY --from=builder /usr/src/app/apps/web/env.sh /app/env.sh
# COPY --from=builder /usr/src/app/apps/web/.env /app/.env

# COPY --from=builder /usr/src/app/apps/web/build /app/build
# COPY --from=builder /usr/src/app/apps/web/public /app/public
# COPY --from=builder /usr/src/app/apps/web/package.json /app/package.json

# CMD [ "pnpm", "start:static:build:http-only" ]
# end production stage
