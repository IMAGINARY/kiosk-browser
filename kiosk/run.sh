#!/bin/bash

#### http://electron.atom.io/docs/v0.33.0/tutorial/debugging-main-process/

SELFDIR=`dirname "$0"`
SELFDIR=`cd "$SELFDIR" && pwd`

if hash electron 2>/dev/null; then
 D=electron
else

 D="node_modules/electron-prebuilt/dist/electron"
 if [ -x "$HOME/$D" ]; then 
   D="$HOME/$D"
 else
   D="/usr/lib/$D"
 fi
fi

ELECTRON="${ELECTRON:-$D}"

[ -x "${ELECTRON}" ] && "${ELECTRON}" "${SELFDIR}" "$@" || echo "Sorry: cannot detect electron binary on your system ['${ELECTRON}'] :("

### http://blog.soulserv.net/building-a-package-featuring-electron-as-a-stand-alone-application/
