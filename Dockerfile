###############################################################################
# Build kiosk-browser redistributable files for Linux
###############################################################################
# Run with
# docker run --rm -ti -v /path/to/your/dist/folder:/dist kiosk-browser-builder
# The distribution files will be copied to /path/to/your/dist/folder/
###############################################################################
FROM ubuntu:14.04.5

RUN apt-get update \
    && apt-get install -y curl git binutils rpm \
    && rm -rf /var/lib/apt/lists/*

RUN curl -sL https://deb.nodesource.com/setup_12.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

CMD git clone https://github.com/IMAGINARY/kiosk-browser \
        && cd kiosk-browser \
        && git checkout `git describe --abbrev=0` \
        && npx yarn install \
        && npx yarn run dist \
        && cp ./dist/*.AppImage ./dist/*.deb ./dist/*.rpm /dist/
