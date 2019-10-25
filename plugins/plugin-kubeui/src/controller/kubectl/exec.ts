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
import { KubeOptions } from './options'

import { stringToTable, KubeTableResponse } from '../../lib/view/formatTable'
import { FinalState } from '../../lib/model/states'

const strings = i18n('plugin-kubeui')

/** Optional argument prepartion */
type Prepare<O = KubeOptions> = (args: Commands.Arguments<O>) => Commands.Arguments<O>

/** No-op argument preparation */
const NoPrepare = <O = KubeOptions>(args: Commands.Arguments<O>) => args

/**
 * Execute the given command in the browser; this dispatches to
 * _kubectl, which runs on the proxy (for electron and headless, these
 * are the same machine).
 *
 */
export function exec<O extends KubeOptions>(
  _args: Commands.Arguments<O>,
  prepare: Prepare<O> = NoPrepare
): Promise<RawResponse> {
  const args = prepare(_args)
  const command = prepare(args)
    .command.replace(/^kubectl(\s)?/, '_kubectl$1')
    .replace(/^k(\s)?/, '_kubectl$1')
  return args.REPL.qexec<RawResponse>(command, undefined, undefined, args.execOptions)
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
  return exec(args, prepare).then(_ => _.content.stdout)
}

export function doExecWithPty<O extends KubeOptions>(
  args: Commands.Arguments<O>,
  prepare: Prepare<O> = NoPrepare
): Promise<Commands.Response> {
  if (isHeadless() || (!inBrowser() && args.execOptions.raw)) {
    return doExecWithStdout(args, prepare)
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

/**
 * Behaves as does `exec`, except that it projects out just the
 * `stdout` part and parses it into a Table model.
 *
 */
export async function doExecWithTable<O extends KubeOptions>(
  args: Commands.Arguments<O>,
  prepare: Prepare<O> = NoPrepare
): Promise<Table | MultiTable> {
  const response = await exec(args, prepare)

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
  prepare?: Prepare<O>
) => async (args: Commands.Arguments<O>): Promise<KubeTableResponse> => {
  const response = await exec<O>(args, prepare)

  if (response.content.code !== 0) {
    const err: Errors.CodedError = new Error(response.content.stderr)
    err.code = response.content.code
    throw err
  } else {
    const rest = args.command.slice(args.command.indexOf(cmd) + cmd.length).replace(/(-f=?|--file=?)/, '')
    return args.REPL.qexec(`status ${rest} --final-state ${finalState} --watch`)
  }
}

export default exec
