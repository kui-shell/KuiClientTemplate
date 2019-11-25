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

import { isHeadless, inBrowser } from '@kui-shell/core/api/capabilities'
import Commands from '@kui-shell/core/api/commands'
import Errors from '@kui-shell/core/api/errors'
import { i18n } from '@kui-shell/core/api/i18n'
import { Table, MultiTable } from '@kui-shell/core/api/table-models'

import RawResponse from './response'
import commandPrefix from '../command-prefix'
import { KubeOptions, getNamespaceForArgv, getContextForArgv } from './options'

import { renderHelp } from '../../lib/util/help'
import { FinalState } from '../../lib/model/states'
import { stringToTable, KubeTableResponse } from '../../lib/view/formatTable'

const strings = i18n('plugin-kubeui')

/** Optional argument prepartion */
export type Prepare<O extends KubeOptions> = (args: Commands.Arguments<O>) => string

/** No-op argument preparation */
const NoPrepare = <O extends KubeOptions>(args: Commands.Arguments<O>) => args.command

/** Special case preparation for status */
export type PrepareForStatus<O extends KubeOptions> = (cmd: string, args: Commands.Arguments<O>) => string

/** Standard status preparation */
function DefaultPrepareForStatus<O extends KubeOptions>(cmd: string, args: Commands.Arguments<O>) {
  const rest = args.argvNoOptions.slice(args.argvNoOptions.indexOf(cmd) + 1).join(' ')
  return `${args.parsedOptions.f || args.parsedOptions.filename || ''} ${rest}`
}

/**
 * Execute the given command in the browser; this dispatches to
 * _kubectl, which runs on the proxy (for electron and headless, these
 * are the same machine).
 *
 */
function doExecWithoutPty<O extends KubeOptions>(
  args: Commands.Arguments<O>,
  prepare: Prepare<O> = NoPrepare
): Promise<RawResponse> {
  const command = prepare(args)
    .replace(/^kubectl(\s)?/, '_kubectl$1')
    .replace(/^k(\s)?/, '_kubectl$1')

  const doubleCheck = /_kubectl(\s)?/.test(command) ? command : `_kubectl ${command}`
  return args.REPL.qexec<RawResponse>(doubleCheck, undefined, undefined, args.execOptions)
}

/**
 * Behaves as does `exec`, except that it projects out just the
 * `stdout` part -- thus ignoring the exit `code` and `stderr`.
 *
 */
export function doExecWithStdout<O extends KubeOptions>(
  args: Commands.Arguments<O>,
  prepare: Prepare<O> = NoPrepare
): Promise<string> {
  return doExecWithoutPty(args, prepare).then(_ => _.content.stdout)
}

/** is the given string `str` the `kubectl` command? */
const isKubectl = (args: Commands.Arguments<KubeOptions>) =>
  (args.argvNoOptions.length === 1 && /^k(ubectl)?$/.test(args.argvNoOptions[0])) ||
  (args.argvNoOptions.length === 2 &&
    args.argvNoOptions[0] === commandPrefix &&
    /^k(ubectl)?$/.test(args.argvNoOptions[1]))

const isUsage = (args: Commands.Arguments<KubeOptions>) =>
  args.parsedOptions.help || args.parsedOptions.h || isKubectl(args)

function doHelp<O extends KubeOptions>(args: Commands.Arguments<O>, response: RawResponse): void {
  const verb = args.argvNoOptions.length >= 2 ? args.argvNoOptions[1] : ''
  throw renderHelp(response.content.stdout, 'kubectl', verb, response.content.code)
}

/**
 * Execute the given command using a pty
 *
 */
export async function doExecWithPty<Response extends Commands.KResponse<any>, O extends KubeOptions>(
  args: Commands.Arguments<O>,
  prepare: Prepare<O> = NoPrepare
): Promise<string | Response> {
  if (isHeadless() || (!inBrowser() && args.execOptions.raw)) {
    return doExecWithStdout(args, prepare)
  } else {
    //
    // For commands `kubectl (--help/-h)` and `k (--help/-h)`, render usage model;
    // Otherwise, execute the given command using a pty
    //
    if (isUsage(args)) {
      const response = await doExecWithoutPty(args, prepare)
      doHelp(args, response)
    } else {
      const commandToPTY = args.command.replace(/^k(\s)/, 'kubectl$1')
      return args.REPL.qexec(
        `sendtopty ${commandToPTY}`,
        args.block,
        undefined,
        Object.assign({}, args.execOptions, { rawResponse: true })
      )
    }
  }
}

/**
 * Decide whether to use a pty or a raw exec.
 *
 */
export async function exec<O extends KubeOptions>(
  args: Commands.Arguments<O>,
  prepare: Prepare<O> = NoPrepare
): Promise<RawResponse> {
  if (args.argvNoOptions.includes('|')) {
    return Promise.resolve({
      content: {
        code: 0,
        stdout: await doExecWithPty(args, prepare),
        stderr: '',
        wasSentToPty: true
      }
    })
  } else {
    const response = await doExecWithoutPty(args, prepare)
    if (isUsage(args)) {
      doHelp(args, response)
    } else {
      return response
    }
  }
}

/**
 * Behaves as does `exec`, except that it projects out just the
 * `stdout` part and parses it into a Table model.
 *
 */
export async function doExecWithTable<O extends KubeOptions>(
  args: Commands.Arguments<O>,
  prepare: Prepare<O> = NoPrepare
): Promise<Table | MultiTable> {
  const response = await doExecWithoutPty(args, prepare)

  const table = stringToTable(response.content.stdout, response.content.stderr, args)
  if (typeof table === 'string') {
    throw new Error(strings('Unable to parse table'))
  } else {
    return table
  }
}

/**
 * Execute a command, and then execute the status command which will
 * poll until the given FinalState is reached.
 *
 */
export const doExecWithStatus = <O extends KubeOptions>(
  cmd: string,
  finalState: FinalState,
  prepareForExec: Prepare<O> = NoPrepare,
  prepareForStatus: PrepareForStatus<O> = DefaultPrepareForStatus
) => async (args: Commands.Arguments<O>): Promise<KubeTableResponse> => {
  const response = await exec<O>(args, prepareForExec)

  if (response.content.code !== 0) {
    const err: Errors.CodedError = new Error(response.content.stderr)
    err.code = response.content.code
    throw err
  } else if (isHeadless()) {
    return response.content.stdout
  } else {
    const contextArgs = `${getNamespaceForArgv(args)} ${getContextForArgv(args)}`
    const watchArgs = `--final-state ${finalState} --watch`

    // this helps with error reporting: if something goes wrong with
    // displaying "status", we can always report the initial response
    // from the exec command
    const errorReportingArgs = `--response "${response.content.stdout}"`

    const statusArgs = prepareForStatus(cmd, args)

    return args.REPL.qexec(`${commandPrefix} status ${statusArgs} ${watchArgs} ${contextArgs} ${errorReportingArgs}`)
  }
}

export default exec
