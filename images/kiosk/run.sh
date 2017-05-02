#!/bin/bash

#### http://electron.atom.io/docs/v0.33.0/tutorial/debugging-main-process/

SELFDIR=`dirname "$0"`
SELFDIR=`cd "$SELFDIR" && pwd`

D="$SELFDIR/node_modules/.bin/electron"

if [ ! -x "${D}" ]; then
  D=""
fi

ELECTRON="${ELECTRON:-$D}"
ARGS="$@"

# cd "$SELFDIR"

if [[ -n "${ELECTRON}" && -r "${SELFDIR}/main.js" && -r "${SELFDIR}/package.json" ]]; then
  echo "Running: '${ELECTRON} ${SELFDIR} $ARGS'"
  exec "${ELECTRON}" "${SELFDIR}" $ARGS
fi

if [[ -x "/opt/kiosk-browser/kiosk-browser" ]]; then
  echo "Note: falling back to '/opt/kiosk-browser/kiosk-browser'"
  exec "/opt/kiosk-browser/kiosk-browser" "--" $ARGS
fi

if hash docker 2>/dev/null; then
  exec docker run -e DISPLAY --rm -it -a stdin -a stdout -a stderr --ipc=host --net=host -v /tmp/:/tmp/:rw -v /dev/shm:/dev/shm hilbert/kiosk /sbin/my_init --skip-startup-files --skip-runit -- /usr/local/bin/run.sh $ARGS
fi

echo "Sorry: cannot detect electron binary on your system :("
exit 1

### http://blog.soulserv.net/building-a-package-featuring-electron-as-a-stand-alone-application/
