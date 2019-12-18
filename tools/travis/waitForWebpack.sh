#!/usr/bin/env bash

# This script brings up the kui proxy and kui webpack server. If you
# want to watch for electron (rather than a browser), set the env var
# TARGET=electron-renderer

set -e
set -o pipefail

if [[ $T = webpack ]]; then
    npm run -s pty:nodejs
fi

(npm run proxy &)
npm run watch:webpack
echo "$(tput setaf 2)ok: webpack ready for e-business$(tput sgr0)"
