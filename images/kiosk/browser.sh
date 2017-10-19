#! /bin/bash

ARGS=$@

SELFDIR=`dirname "$0"`
SELFDIR=`cd "$SELFDIR" && pwd`

exec "$SELFDIR/run.sh" --fullscreen --kiosk --incognito --high-dpi-support=1 --force-device-scale-factor=1 --enable-transparent-visuals --disable-background-timer-throttling ${ARGS}
