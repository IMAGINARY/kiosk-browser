#!/bin/bash

SELFDIR=`dirname "$0"`
SELFDIR=`cd "$SELFDIR" && pwd`
# ARG="$ARG"

#if [[ -n "${ARG}" ]]; then 
#  ARG="-l ${ARG}"
#fi

# exec firefox -no-remote -P kiosk $1
#export NODE_PATH="/opt/node_modules"
#export ELECTRON="$NODE_PATH/.bin/electron"
#export PATH="$PATH:$NODE_PATH/.bin/"

# exec /opt/launch.sh /opt/kiosk/browser.sh -vvvvv -z 0.1 -l $@

# cd '/opt/kiosk-browser/'

exec "$SELFDIR/browser.sh" --fullscreen --kiosk --localhost "$@"

## pkill -9 dbus-launch
