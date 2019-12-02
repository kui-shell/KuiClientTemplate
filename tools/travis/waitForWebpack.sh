#!/usr/bin/env bash

# this script uses curl to ping the webpack dev server port until we
# get a 200 response

set -e
set -o pipefail

if [[ $T = webpack ]]; then
    npm run -s pty:nodejs

    (npm run proxy &)
    (npm run webpack &)
                            
    echo "$(tput setaf 3)waiting for webpack to wake up$(tput sgr0)"

    # source: https://gist.github.com/rgl/f90ff293d56dbb0a1e0f7e7e89a81f42
    # with one modification: port 9000 -> port 9080
    bash -c 'while [[ "$(curl -s -o /dev/null -w ''%{http_code}'' localhost:9080)" != "200" ]]; do echo "$(tput setaf 3)still waiting for webpack to wake up$(tput sgr0)"; sleep 5; done'

    sleep 10

    echo "$(tput setaf 2)ok: webpack ready for e-business$(tput sgr0)"
fi
