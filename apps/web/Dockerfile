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
RUN echo 'Skipping the RUN --mount=type=cache, because it seems to hang/break the build every time.'

# Currently, the steps of `pnpm install` and `cd ./apps/web && npm run start:static:build:http-only`
# are being ran inside the container manually, due to a tendency for the automatic version 
# of this install to freeze.

ARG PROXY_HOST
ARG FRONT_BASE_URL='${PROXY_HOST}/web'
ENV PROXY_HOST=${PROXY_HOST}
ENV FRONT_BASE_URL=${FRONT_BASE_URL}
# ENV FRONT_BASE_CONTEXT_PATH=${FRONT_BASE_CONTEXT_PATH}

# Set these for the webapp build to use
ENV SKIP_PREFLIGHT_CHECK=true
ENV REACT_APP_ENVIRONMENT=local
ENV BASE_ADDRESS=${PROXY_HOST}/web
ENV REACT_APP_WS_URL=${PROXY_HOST}/ws
ENV API_ROOT_URL=${PROXY_HOST}/api
ENV REACT_APP_API_URL=${API_ROOT_URL}
ENV FRONT_BASE_URL=${BASE_ADDRESS}
ENV REACT_APP_PUBLIC_URL=${FRONT_BASE_URL}

RUN echo "value for PROXY_HOST:" ${PROXY_HOST}
RUN echo "value for FRONT_BASE_URL:" ${FRONT_BASE_URL}

# debug
RUN echo "value for SKIP_PREFLIGHT_CHECK: ${SKIP_PREFLIGHT_CHECK}"
RUN echo "value for REACT_APP_ENVIRONMENT: ${REACT_APP_ENVIRONMENT}"
RUN echo "value for BASE_ADDRESS: ${BASE_ADDRESS}"
RUN echo "value for REACT_APP_WS_URL: ${REACT_APP_WS_URL}"
RUN echo "value for API_ROOT_URL: ${API_ROOT_URL}"
RUN echo "value for REACT_APP_API_URL: ${REACT_APP_API_URL}"
RUN echo "value for FRONT_BASE_URL: ${FRONT_BASE_URL}"
RUN echo "value for REACT_APP_PUBLIC_URL: ${REACT_APP_PUBLIC_URL}"
# TODO - Remove the above ENV directives? Since the .env file being built below is what is used for the webapp?

RUN pnpm install || echo "ok, apparently pnpm install failed"

WORKDIR /usr/src/app/apps/web 

# Set up the .env file for the build
RUN printf "SKIP_PREFLIGHT_CHECK=true\n\
REACT_APP_ENVIRONMENT=local\n\
BASE_ADDRESS=${PROXY_HOST}/web\n\
REACT_APP_WS_URL=${PROXY_HOST}/ws\n\
API_ROOT_URL=${PROXY_HOST}/api\n\
REACT_APP_API_URL=${API_ROOT_URL}\n\
FRONT_BASE_URL=${BASE_ADDRESS}\n\
REACT_APP_PUBLIC_URL=${FRONT_BASE_URL}\n" > .env

RUN echo "value of .env file:"
RUN echo cat .env

RUN echo "pwd of current loc" 
RUN echo pwd
RUN sleep 3
RUN echo "Running trytofixbuild.sh..."
RUN bash ./trytofixbuild.sh
RUN echo "Ran trytofixbuild.sh."



# But this is the dev app.
# RUN ["pnpm", "run", "start"];
# This command will build and then start the webapp
# CMD ["npm", "run", "start:docker"]
# TODO -

  
  # Currently, the webapp still has a redirect bug when 
  # an attempt to load an invite link is made
  # So, using the dev app until that is resolved:
# CMD ["npm", "run", "start:dev"]
# "start:docker"]
#  "start:dev"]
# CMD [""]
CMD ["sleep", "infinity"]
# TODO - add PM2 or something for in-container webapp management, since we have to start it manually?
