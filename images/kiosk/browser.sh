#! /bin/bash

ARGS=$@
[ -z "${ARGS}" ] && ARGS=-l http://localhost:8080/

#SELFDIR=`dirname "$0"`
#SELFDIR=`cd "$SELFDIR" && pwd`

/usr/local/src/kiosk/run.sh ${ARGS}
