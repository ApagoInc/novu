FROM nginx:1.27.3-alpine

# Custom NGINX config that will be injected into the http block of the NGINX image's config
# - We use a .template file, specifically - and the official NGINX image fills in env vars and turns it into an actual .conf file.
# TODO - switch to .template file.

COPY ./nginx_conf/default.conf /etc/nginx/conf.d/default.conf
# conf.d/default.conf
# default.conf.template

ARG HTTPS_CERT_OS_PATH
ARG HTTPS_KEY_OS_PATH
ENV HTTPS_CERT_OS_PATH=$HTTPS_CERT_OS_PATH
ENV HTTPS_KEY_OS_PATH=$HTTPS_KEY_OS_PATH

# When using "BUILDKIT_PROGRESS=plain" to debug:
# RUN echo "HTTPS_CERT_OS_PATH: ${HTTPS_CERT_OS_PATH}"
# RUN echo "HTTPS_KEY_OS_PATH: ${HTTPS_KEY_OS_PATH}"

# HTTPS cert and key for NGINX

# TODO fix this where the NGINX conf can get the env vars/data

# TODO - Beware - hardcoded cert and key names! Fix this to be from config
COPY ${HTTPS_CERT_OS_PATH} /etc/pki/nginx/fullchain.pem
COPY ${HTTPS_KEY_OS_PATH} /etc/pki/nginx/private/privkey.pem

CMD ["nginx-debug", "-g", "daemon off;"]
