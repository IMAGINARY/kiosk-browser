FROM hilbert/gui

MAINTAINER Oleksandr Motsak <malex984+hilbert.kiosk@gmail.com>

# https://github.com/nodesource/distributions

RUN wget -qO- https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add -

ADD https://deb.nodesource.com/setup_4.x /tmp/setup_4.sh
RUN chmod +x /tmp/setup_4.sh && bash /tmp/setup_4.sh

##  curl --silent --location https://deb.nodesource.com/setup_4.x | sudo -E bash -
### wget -qO- https://deb.nodesource.com/setup_4.x | bash -

RUN update.sh && install.sh nodejs && clean.sh

#RUN npm install electron-prebuilt -g 
## && npm install asar -g && \
##    npm install yargs -g

RUN mkdir -p /usr/local/src/kiosk
# WORKDIR /usr/local/src/kiosk/

COPY package.json /usr/local/src/kiosk/
RUN cd /usr/local/src/kiosk && npm install electron-prebuilt --save-dev && npm install yargs --save-dev

COPY index.html main.js run.sh browser.sh /usr/local/src/kiosk/
COPY browser.sh /usr/local/bin/

# ONBUILD COPY package.json index.html main.js /usr/src/kiosk/
# CMD [ "npm", "start" ]
# CMD [ "launch.sh", "/usr/src/kiosk/run.sh" ] ## kiosk
# /usr/local/src/kiosk/run.sh # !




ARG IMAGE_VERSION=latest
ARG GIT_NOT_CLEAN_CHECK
# Build-time metadata as defined at http://label-schema.org
ARG BUILD_DATE=someday
ARG VCS_REF=HEAD
ARG VCS_URL="https://github.com/hilbert/hilbert-docker-images"

ARG DOCKERFILE="/images/kiosk/Dockerfile"
LABEL org.label-schema.description="Kiosk-mode browser using Electron. Base for WebBrowser-related images (as well as hilbert/gui)" \
      org.label-schema.build-date="${BUILD_DATE}" \
      org.label-schema.vcs-ref="${VCS_REF}" \
      org.label-schema.vcs-url="${VCS_URL}" \
      org.label-schema.version="${IMAGE_VERSION}" \
      com.microscaling.docker.dockerfile="${DOCKERFILE}" \
      IMAGE_VERSION="${IMAGE_VERSION}" \
      GIT_NOT_CLEAN_CHECK="${GIT_NOT_CLEAN_CHECK}"
