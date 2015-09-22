FROM malex984/dockapp:play

MAINTAINER Oleksandr Motsak <malex984@googlemail.com>

RUN curl --silent --location https://deb.nodesource.com/setup_4.x | sudo bash -
RUN DEBIAN_FRONTEND=noninteractive apt-get -y -q update && \
    DEBIAN_FRONTEND=noninteractive apt-get -q -y install \
                                 --no-install-recommends \
 		                   nodejs \
                                   libgtk2.0-0 libgconf-2-4 libasound2 libxtst6 libxss1 libnss3 \
    && \
    DEBIAN_FRONTEND=noninteractive apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN npm install electron-prebuilt -g && \
    npm install asar -g && \
    npm install yargs -g


RUN mkdir -p /usr/src/kiosk
COPY index.html main.js package.json run.sh /usr/src/kiosk/

WORKDIR /usr/src/kiosk
RUN npm install -g

# ONBUILD COPY package.json index.html main.js /usr/src/kiosk/
# CMD [ "npm", "start" ]
