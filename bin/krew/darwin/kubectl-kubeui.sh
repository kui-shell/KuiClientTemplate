#!/usr/bin/env bash

BIN=$(readlink "$0")
SCRIPTDIR=$(cd $(dirname "$BIN") && pwd)

KUI_COMMAND_CONTEXT='["kubeui","kubectl"]' "$SCRIPTDIR"/Kui-darwin-x64/Kui.app/Contents/MacOS/Kui $@ &
