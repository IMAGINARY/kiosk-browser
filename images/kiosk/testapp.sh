#! /bin/bash

SELFDIR=`dirname "$0"`
SELFDIR=`cd "$SELFDIR" && pwd`

exec "$SELFDIR/browser.sh" --verbose --verbose --verbose --verbose --integration --testapp --localhost --fullscreen --kiosk --always-on-top "$@"
