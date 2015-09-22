#!/bin/bash

#### http://electron.atom.io/docs/v0.33.0/tutorial/debugging-main-process/

SELFDIR=`dirname "$0"`
SELFDIR=`cd "$SELFDIR" && pwd`

if hash electron 2>/dev/null; then
 D=electron
else
 D="$HOME/node_modules/electron-prebuilt/dist/electron"
fi

${ELECTRON:-$D}  --enable-unsafe-es3-apis "${SELFDIR}" "$@"
