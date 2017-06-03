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

PULSE_SERVER="${PULSE_SERVER:-/run/user/$UID/pulse/native11}"
PULSE_COOKIE="${PULSE_COOKIE:-$HOME/.config/pulse/cookie11}"

  if [[ -w "${PULSE_COOKIE}" && -S "${PULSE_SERVER}" ]]; then
    SOUND_OPTS="-e PULSE_COOKIE=/run/pulse/cookie -e PULSE_SERVER=/run/pulse/native -v ${PULSE_SERVER}:/run/pulse/native:rw -v ${PULSE_COOKIE}:/run/pulse/cookie:rw"
  else
    SOUND_OPTS="-v ${PWD}/.asoundrc:/root/.asoundrc:ro --privileged=true"
  fi

  exec docker run \
  --rm -it -a stdin -a stdout -a stderr --ipc=host --net=host \
  -e DISPLAY -e LANG -e LANGUAGE -e LC_ALL -e LC_TIME \
  -e LC_CTYPE -e LC_NUMERIC -e LC_COLLATE -e LC_MONETARY \
  -e LC_MESSAGES -e LC_PAPER -e LC_NAME -e LC_ADDRESS \
  -e LC_TELEPHONE -e LC_MEASUREMENT -e LC_IDENTIFICATION \
  ${SOUND_OPTS} \
  -v /tmp/:/tmp/:rw \
  -v /dev/shm:/dev/shm \
  -v /etc/localtime:/etc/localtime:ro \
  hilbert/kiosk \
  /sbin/my_init --skip-startup-files --skip-runit -- /usr/local/bin/run.sh $ARGS
fi

echo "Sorry: cannot detect electron binary on your system :("
exit 1

### http://blog.soulserv.net/building-a-package-featuring-electron-as-a-stand-alone-application/
