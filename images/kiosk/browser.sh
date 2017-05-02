#! /bin/bash

ARGS=$@

SELFDIR=`dirname "$0"`
SELFDIR=`cd "$SELFDIR" && pwd`

exec "$SELFDIR/run.sh" --fullscreen --kiosk --high-dpi-support=1 --force-device-scale-factor=1 --enable-transparent-visuals ${ARGS}
