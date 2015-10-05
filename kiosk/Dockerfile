FROM malex984/dockapp:play

MAINTAINER Oleksandr Motsak <malex984@googlemail.com>

# https://github.com/nodesource/distributions
ADD https://deb.nodesource.com/setup_4.x /tmp/setup_4.sh

RUN chmod +x /tmp/setup_4.sh && bash /tmp/setup_4.sh && rm /tmp/setup_4.sh

### wget -qO- https://deb.nodesource.com/setup_4.x | bash -
### curl --silent --location https://deb.nodesource.com/setup_4.x | sudo bash -

RUN update.sh && \
    install.sh --no-install-recommends \
       nodejs libgtk2.0-0 libgconf-2-4 libasound2 libxtst6 libxss1 libnss3 \
    && \
    clean.sh

RUN npm install electron-prebuilt -g 
## && npm install asar -g && \
##    npm install yargs -g

### note : will cache... :(
### RUN git clone https://github.com/malex984/dockapp /usr/src/dockapp/

RUN mkdir -p /usr/src/kiosk
COPY index.html main.js package.json run.sh Films-Slider Gallery-Slider jsqrcode /usr/src/kiosk/

RUN cd /usr/src/kiosk && npm install yargs --save-devg

WORKDIR /usr/src/kiosk

# ONBUILD COPY package.json index.html main.js /usr/src/kiosk/
# CMD [ "npm", "start" ]
# CMD [ "launch.sh", "/usr/src/kiosk/run.sh" ] ## ??
#  /usr/src/kiosk/run.sh # !
