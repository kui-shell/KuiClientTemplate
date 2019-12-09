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

import { i18n, Arguments, Registrar, MultiModalResponse } from '@kui-shell/core'

import flags from './flags'
import kubeuiApiVersion from './apiVersion'
import commandPrefix from '../command-prefix'
import { doExecWithPty, doExecWithStdout, Prepare } from './exec'
import { KubeOptions, getLabel, getNamespace } from './options'

import { formatLogs } from '../../lib/util/log-parser'
import { KubeResourceWithInvolvedObject } from '../../lib/model/resource'

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
function prepareArgs(args: Arguments<LogOptions>) {
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

function prepareArgsForLogs(args: Arguments<LogOptions>) {
  const prepared = prepareArgs(args)
  if (!args.parsedOptions.previous) {
    return prepared
  } else {
    return prepared.replace(/--previous/, '')
  }
}
function prepareArgsForPrevious(args: Arguments<LogOptions>) {
  const prepared = prepareArgs(args)
  if (args.parsedOptions.previous) {
    return prepared
  } else {
    return `${prepared} --previous`
  }
}

const getLogContent = (args: Arguments<LogOptions>, prepare: Prepare<LogOptions>) => {
  return doExecWithStdout(args, prepare)
}

async function doGetLogsAsMMR(args: Arguments<LogOptions>): Promise<MultiModalResponse> {
  const name = args.argvNoOptions[args.argvNoOptions.indexOf('logs') + 1]
  const namespace = getNamespace(args)
  const containerName = args.argvNoOptions[args.argvNoOptions.indexOf('logs') + 2]

  const logs = {
    mode: 'logs',
    label: strings('logs'),
    content: async () => formatLogs(await getLogContent(args, prepareArgsForLogs), args.execOptions),
    defaultMode: !args.parsedOptions.previous
  }

  const previous = {
    mode: 'previous',
    label: strings('previous'),
    content: async () => formatLogs(await getLogContent(args, prepareArgsForPrevious), args.execOptions),
    defaultMode: args.parsedOptions.previous
  }

  // look for kind in the name; e.g. k logs deployment/myDeployment
  // the default, without a prefix "kind/" part, is pod
  // notes: these are going to be used as properties of involvedObject
  const kindMatch = name && name.match(/(\w+)\//)
  const kindOfInvolved = kindMatch ? kindMatch[1] : 'pod'
  const apiVersionOfInvolved = /^deploy/i.test(kindOfInvolved)
    ? 'extensions/v1beta1'
    : /^job/i.test(kindOfInvolved)
    ? 'batch/v1'
    : 'v1'

  const involvedObject =
    kindOfInvolved && apiVersionOfInvolved
      ? {
          apiVersion: apiVersionOfInvolved,
          kind: kindOfInvolved,
          name,
          namespace
        }
      : undefined

  const response: MultiModalResponse<KubeResourceWithInvolvedObject> = {
    apiVersion: kubeuiApiVersion,
    kind: 'logs',
    metadata: {
      name: containerName || name || getLabel(args) || '', // name is optional when label selector exists
      namespace
    },
    involvedObject,
    originatingCommand: args.command,
    data: await getLogContent(args, prepareArgsForLogs),
    modes: [logs, previous]
  }

  return response
}

function doLogs(args: Arguments<LogOptions>): Promise<string | KubeResourceWithInvolvedObject | MultiModalResponse> {
  const streamed = args.parsedOptions.follow || args.parsedOptions.f
  const hasSelector = args.parsedOptions.selector || args.parsedOptions.l
  const resourePos = args.argvNoOptions[0] === commandPrefix ? 4 : 3
  const hasResource = args.argvNoOptions.length >= resourePos

  if (!streamed && (hasResource || hasSelector)) {
    return doGetLogsAsMMR(args)
  } else {
    return doExecWithPty(args)
  }
}

export default (registrar: Registrar) => {
  registrar.listen(`/${commandPrefix}/kubectl/logs`, doLogs, flags)
  registrar.listen(`/${commandPrefix}/k/logs`, doLogs, flags)
}
