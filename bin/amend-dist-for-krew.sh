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
    tar -C krew/darwin -uvf /tmp/Kui-darwin-x64-tmp.tar kubectl-kubeui.sh
    set -e

    echo "zipping for darwin"
    gzip -9 /tmp/Kui-darwin-x64-tmp.tar
    mv -f /tmp/Kui-darwin-x64-tmp.tar.gz ../dist/electron/Kui-darwin-x64.tar.gz
}

function linux {
    echo "updating zip for linux"
    (cd krew/linux && zip -u ../../../dist/electron/Kui-linux-x64.zip kubectl-kubeui.sh)
}

darwin &
linux &

wait
