FROM node:16-alpine

RUN echo "initial pwd before workdir set" && sleep 1 && echo $(pwd) && sleep 1 && echo ok

WORKDIR /usr/src/app

RUN echo "pwd after workdir set" && sleep 1 && echo $(pwd) && sleep 1 && echo ok

# COPY package.json app.js ./
COPY . ./

# TODO - figure out what in the world the problem is here with node_modules, MODULE_NOT_FOUND, etc.

RUN npm install
# The above also copies along "./certs" from the 'proxy' dir (the build context)

# RUN mkdir ./certs
RUN echo hmmm && sleep 1 && echo $(pwd) && sleep 1 && echo ok


ARG HTTPS_CERT_OS_PATH
ARG HTTPS_KEY_OS_PATH

ENV HTTPS_CERT_OS_PATH ${HTTPS_CERT_OS_PATH}

ENV HTTPS_KEY_OS_PATH ${HTTPS_KEY_OS_PATH}

RUN echo "HTTPS_KEY_OS_PATH: ${HTTPS_KEY_OS_PATH}"

RUN echo "HTTPS_CERT_OS_PATH ${HTTPS_CERT_OS_PATH}"

COPY ${HTTPS_CERT_OS_PATH} ./certs  
COPY ${HTTPS_KEY_OS_PATH} ./certs

# CMD ["sleep", "infinity"]   
# For debugging in container - run the above with `docker compose up --build proxy -d`    - allow using shell inside container with subsequent 'docker exec -it sh proxy'


CMD ["npm", "start"]
