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
  echo "Note: falling back to '/opt/kiosk-browser/kiosk-browser'..."
  exec "/opt/kiosk-browser/kiosk-browser" "--" $ARGS
fi

if hash docker 2>/dev/null; then
   echo "Note: falling back to use docker image 'hilbert/kiosk'..."

   export PULSE_SERVER="${PULSE_SERVER:-/run/user/${UID}/pulse/native}"
   export PULSE_COOKIE="${PULSE_COOKIE:-${HOME}/.config/pulse/cookie}"
   
   if [[ ! -r "${PULSE_COOKIE}" ]]; then
        unset PULSE_COOKIE
   fi

   if [[ ! -S "${PULSE_SERVER}" ]]; then
        unset PULSE_SERVER
        unset PULSE_COOKIE
   fi


   export DISPLAY="${DISPLAY:-:0}"

  if [[ -n "${PULSE_SERVER}" ]]; then
    SOUND_OPTS="-e PULSE_SERVER=/run/pulse/native -v ${PULSE_SERVER}:/run/pulse/native:rw"
    [[ -n "${PULSE_COOKIE}" ]] && [[ -r "${PULSE_COOKIE}" ]] && \
      SOUND_OPTS="${SOUND_OPTS} -e PULSE_COOKIE=/run/pulse/cookie -v ${PULSE_COOKIE}:/run/pulse/cookie:ro"
  else
    SOUND_OPTS="--privileged=true"
  fi

    if [[ -r "${PWD}/.asoundrc" ]]; then
      SOUND_OPTS="${SOUND_OPTS} -v ${PWD}/.asoundrc:/root/.asoundrc:ro"
    elif [[ -r "${HOME}/.asoundrc" ]]; then 
      SOUND_OPTS="${SOUND_OPTS} -v ${HOME}/.asoundrc:/root/.asoundrc:ro"
    fi
  IMAGE_VERSION="${IMAGE_VERSION:-latest}"
  KIOSK_IMAGE="${KIOSK_IMAGE:-hilbert/kiosk:${KIOSK_VERSION}}"
#-it -a stdin -a stdout -a stderr --rm 
  exec docker run --ipc=host --net=host \
  -d \
  -e DISPLAY -e LANG -e LANGUAGE -e LC_ALL -e LC_TIME \
  -e LC_CTYPE -e LC_NUMERIC -e LC_COLLATE -e LC_MONETARY \
  -e LC_MESSAGES -e LC_PAPER -e LC_NAME -e LC_ADDRESS \
  -e LC_TELEPHONE -e LC_MEASUREMENT -e LC_IDENTIFICATION \
  ${SOUND_OPTS} \
  -v /tmp/:/tmp/:rw \
  -v /dev/shm:/dev/shm \
  -v /dev/snd:/dev/snd \
  -v /etc/localtime:/etc/localtime:ro \
  "${KIOSK_IMAGE}" \
  /sbin/my_init --skip-startup-files --skip-runit -- \
    /usr/local/bin/run.sh $ARGS
#    launch.sh 
# /bin/bash

fi

echo "Sorry: cannot detect electron binary on your system :("
exit 1

### http://blog.soulserv.net/building-a-package-featuring-electron-as-a-stand-alone-application/
