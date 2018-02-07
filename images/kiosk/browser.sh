#! /bin/bash

ARGS=$@

SELFDIR=`dirname "$0"`
SELFDIR=`cd "$SELFDIR" && pwd`

exec "$SELFDIR/run.sh" ${ARGS}
