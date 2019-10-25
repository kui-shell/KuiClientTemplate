/*
 * Copyright 2019 IBM Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Commands from '@kui-shell/core/api/commands'
import { i18n } from '@kui-shell/core/api/i18n'
import { MultiModalResponse } from '@kui-shell/core/api/ui-lite'

import flags from './flags'
import commandPrefix from '../command-prefix'
import { doExecWithPty, doExecWithStdout, Prepare } from './exec'
import { KubeOptions, getNamespace } from './options'

import { formatLogs } from '../../lib/util/log-parser'
import { KubeResource } from '../../lib/model/resource'

const strings = i18n('plugin-kubeui')

interface LogOptions extends KubeOptions {
  f: string
  follow: string
  previous: boolean
}

/**
 * don't fetch too many log entries
 *
 */
function prepareArgs(args: Commands.Arguments<LogOptions>) {
  //
  // the default log limit is... unlimited? let's make sure we don't
  // cause chaos here by requesting too many log lines
  //
  let command = args.command

  if (!args.parsedOptions.tail && !args.parsedOptions.since) {
    // debug('limiting log lines')
    command = `${command} --tail 1000`
  }

  return command
}

function prepareArgsForLogs(args: Commands.Arguments<LogOptions>) {
  const prepared = prepareArgs(args)
  if (!args.parsedOptions.previous) {
    return prepared
  } else {
    return prepared.replace(/--previous/, '')
  }
}
function prepareArgsForPrevious(args: Commands.Arguments<LogOptions>) {
  const prepared = prepareArgs(args)
  if (args.parsedOptions.previous) {
    return prepared
  } else {
    return `${prepared} --previous`
  }
}

const getLogContent = (args: Commands.Arguments<LogOptions>, prepare: Prepare<LogOptions>) => async (): Promise<
  HTMLElement
> => {
  const logString = await doExecWithStdout(args, prepare)
  return formatLogs(logString, args.execOptions)
}

async function doGetLogsAsMMR(args: Commands.Arguments<LogOptions>): Promise<MultiModalResponse> {
  const name = args.argvNoOptions[args.argvNoOptions.indexOf('logs') + 1]
  const namespace = getNamespace(args)
  const containerName = args.argvNoOptions[args.argvNoOptions.indexOf('logs') + 2]

  const logs = {
    mode: 'logs',
    label: strings('logs'),
    content: getLogContent(args, prepareArgsForLogs),
    defaultMode: !args.parsedOptions.previous
  }

  const previous = {
    mode: 'previous',
    label: strings('previous'),
    content: getLogContent(args, prepareArgsForPrevious),
    defaultMode: args.parsedOptions.previous
  }

  return {
    kind: 'logs',
    metadata: {
      name: containerName || name,
      namespace
    },
    modes: [logs, previous]
  }
}

function doLogs(args: Commands.Arguments<LogOptions>): Promise<string | KubeResource | MultiModalResponse> {
  if (args.parsedOptions.f || args.parsedOptions.follow) {
    // log following? use a pty
    return doExecWithPty(args)
  } else {
    return doGetLogsAsMMR(args)
  }
}

export default (commandTree: Commands.Registrar) => {
  commandTree.listen(`/${commandPrefix}/kubectl/logs`, doLogs, flags)
  commandTree.listen(`/${commandPrefix}/k/logs`, doLogs, flags)
}
