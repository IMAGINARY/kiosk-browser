FROM malex984/dockapp:test

MAINTAINER Oleksandr Motsak <malex984@googlemail.com>

# https://github.com/nodesource/distributions

RUN wget -qO- https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add -

ADD https://deb.nodesource.com/setup_4.x /tmp/setup_4.sh
RUN chmod +x /tmp/setup_4.sh && bash /tmp/setup_4.sh && rm /tmp/setup_4.sh

##  curl --silent --location https://deb.nodesource.com/setup_4.x | sudo -E bash -
### wget -qO- https://deb.nodesource.com/setup_4.x | bash -

RUN update.sh && \
    install.sh --no-install-recommends \
       nodejs libgtk2.0-0 libgconf-2-4 libasound2 libxtst6 libxss1 libnss3 \
       mtdev-tools libmtdev-dev libmtdev1 \
    && \
    clean.sh

#RUN npm install electron-prebuilt -g 
## && npm install asar -g && \
##    npm install yargs -g

### note : will cache... :(
### RUN git clone https://github.com/malex984/dockapp /usr/local/src/dockapp/

RUN mkdir -p /usr/local/src/kiosk
WORKDIR /usr/local/src/kiosk/

COPY package.json /usr/local/src/kiosk/
RUN cd /usr/local/src/kiosk && npm install electron-prebuilt --save-dev && npm install yargs --save-dev

COPY index.html main.js run.sh /usr/local/src/kiosk/

# ONBUILD COPY package.json index.html main.js /usr/src/kiosk/
# CMD [ "npm", "start" ]
# CMD [ "launch.sh", "/usr/src/kiosk/run.sh" ] ## ??
# /usr/local/src/kiosk/run.sh # !
