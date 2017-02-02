FROM hilbert/gui

ARG IMAGE_VERSION=latest
LABEL IMAGE_VERSION=${IMAGE_VERSION}

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
# CMD [ "launch.sh", "/usr/src/kiosk/run.sh" ] ## ??
# /usr/local/src/kiosk/run.sh # !
