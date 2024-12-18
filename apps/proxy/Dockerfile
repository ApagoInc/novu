FROM nginx:1.27.3-alpine

# Custom NGINX config that will be injected into the http block of the NGINX image's config
COPY ./nginx_conf/default.conf /etc/nginx/conf.d/default.conf

ARG HTTPS_CERT_OS_PATH
ARG HTTPS_KEY_OS_PATH
ENV HTTPS_CERT_OS_PATH=$HTTPS_CERT_OS_PATH
ENV HTTPS_KEY_OS_PATH=$HTTPS_KEY_OS_PATH

# When using "BUILDKIT_PROGRESS=plain" to debug:
# RUN echo "HTTPS_CERT_OS_PATH: ${HTTPS_CERT_OS_PATH}"
# RUN echo "HTTPS_KEY_OS_PATH: ${HTTPS_KEY_OS_PATH}"

# HTTPS cert and key for NGINX
COPY ${HTTPS_CERT_OS_PATH} /etc/pki/nginx/server.cert
COPY ${HTTPS_KEY_OS_PATH} /etc/pki/nginx/private/server.key

CMD ["nginx-debug", "-g", "daemon off;"]
