#! /bin/bash

SELFDIR=`dirname "$0"`
SELFDIR=`cd "$SELFDIR" && pwd`

exec "$SELFDIR/run.sh" "$@"
