#!/usr/bin/env bash

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

KUI_COMMAND_CONTEXT='["kubeui","kubectl"]' "$SCRIPTDIR"/Kui-linux-x64/Kui $@ &
