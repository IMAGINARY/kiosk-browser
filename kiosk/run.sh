#!/bin/bash

#### http://electron.atom.io/docs/v0.33.0/tutorial/debugging-main-process/

SELFDIR=`dirname "$0"`
SELFDIR=`cd "$SELFDIR" && pwd`

D="$PWD/node_modules/electron-prebuilt/dist/electron"

ELECTRON="${ELECTRON:-$D}"

[ -x "${ELECTRON}" ] && "${ELECTRON}" "${SELFDIR}" "$@" || echo "Sorry: cannot detect electron binary on your system ['${ELECTRON}'] :("

### http://blog.soulserv.net/building-a-package-featuring-electron-as-a-stand-alone-application/
