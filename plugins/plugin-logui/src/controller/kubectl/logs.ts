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

import { Arguments, Registrar } from '@kui-shell/core'
import {
  KubeOptions,
  doExecWithPty,
  doExecWithStdout,
  defaultFlags as flags,
  getNamespace
} from '@kui-shell/plugin-kubeui'

import commandPrefix from '../command-prefix'
import { formatAsTable } from '../../renderers/table'

interface LogOptions extends KubeOptions {
  f: string
  follow: string
  previous: boolean
}

/**
 * don't fetch too many log entries
 *
 */
function prepareCommand(args: Arguments<LogOptions>): string {
  //
  // the default log limit is... unlimited? let's make sure we don't
  // cause chaos here by requesting too many log lines
  //
  let command = args.command.replace(new RegExp(`^\\s*${commandPrefix}`), '')

  if (!args.parsedOptions.tail && !args.parsedOptions.since) {
    // debug('limiting log lines')
    command = `${command} --tail 20`
  }

  return command
}

/**
 * Fetch an interval of log records, and display them as a Kui table.
 *
 */
async function getLogsAsTable(args: Arguments<LogOptions>) {
  const raw = await doExecWithStdout(args, prepareCommand)

  return formatAsTable(raw, {
    name: args.argvNoOptions[args.argvNoOptions.indexOf('logs') + 1],
    namespace: (args && getNamespace(args)) || 'default'
  })
}

/**
 * Either render an interval of logs as a Kui table, or send the
 * request to a PTY for deeper handling.
 *
 */
function doLogs(args: Arguments<LogOptions>) {
  const streamed = args.parsedOptions.follow || args.parsedOptions.f
  const hasSelector = args.parsedOptions.selector || args.parsedOptions.l
  const resourePos = args.argvNoOptions[0] === commandPrefix ? 4 : 3
  const hasResource = args.argvNoOptions.length >= resourePos

  if (!streamed && (hasResource || hasSelector)) {
    // render as Kui table
    return getLogsAsTable(args)
  } else {
    // send to PTY
    if (streamed && !args.parsedOptions.since) {
      // see https://github.com/kui-shell/plugin-kubeui/issues/210
      const since = '10s'
      args.parsedOptions.since = since
      args.argvNoOptions.push(since)
      args.argv.push(since)
      args.command = args.command + ' --since=10s'
    }

    return doExecWithPty(args)
  }
}

export default (registrar: Registrar) => {
  registrar.listen(`/${commandPrefix}/kubectl/logs`, doLogs, flags)
  registrar.listen(`/${commandPrefix}/k/logs`, doLogs, flags)
}
