#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
cd "$SCRIPTDIR"

function darwin {
    # Apparently bzip2 tarballs cannot be updated in place. Hence, we
    # have to unzip, update, then re-zip.
    echo "unzipping for darwin"
    bunzip2 -c ../dist/electron/Kui-darwin-x64.tar.bz2 > /tmp/Kui-darwin-x64-tmp.tar

    echo "updating tarball for darwin"
    set +e
    (cd krew && tar uvf /tmp/Kui-darwin-x64-tmp.tar Kui-darwin-x64)
    set -e

    echo "zipping for darwin"
    bzip2 -9 /tmp/Kui-darwin-x64-tmp.tar
    mv -f /tmp/Kui-darwin-x64-tmp.tar.bz2 ../dist/electron/Kui-darwin-x64.tar.bz2
}

function linux {
    echo "updating zip for linux"
    (cd krew && zip -r -u ../../dist/electron/Kui-linux-x64.zip Kui-linux-x64)
}

darwin &
linux &

wait
