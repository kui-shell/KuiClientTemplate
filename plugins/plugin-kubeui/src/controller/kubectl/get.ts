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
import Errors from '@kui-shell/core/api/errors'
import Tables from '@kui-shell/core/api/tables'
import { Table } from '@kui-shell/core/api/table-models'

import flags from './flags'
import { exec } from './exec'
import { RawResponse } from './response'
import commandPrefix from '../command-prefix'
import { KubeResource } from '../../lib/model/resource'
import { KubeOptions, isEntityRequest, isTableRequest, formatOf, isWatchRequest, isTableWatchRequest } from './options'
import { stringToTable, KubeTableResponse } from '../../lib/view/formatTable'

/**
 * For now, we handle watch ourselves, so strip these options off the command line
 *
 */
function prepareArgsForGet(args: Commands.Arguments<KubeOptions>) {
  const stripThese = ['-w=true', '--watch=true', '--watch-only=true', '-w', '--watch', '--watch-only']

  return stripThese.reduce((cmd, strip) => cmd.replace(new RegExp(`(\\s)${strip}`), '$1'), args.command)
}

/**
 * kubectl get as table response
 *
 */
function doGetTable(args: Commands.Arguments<KubeOptions>, response: RawResponse): KubeTableResponse {
  const {
    content: { stderr, stdout }
  } = response

  const command = 'kubectl'
  const verb = 'get'
  const entityType = args.argvNoOptions[2]

  const table = stringToTable(stdout, stderr, args, command, verb, entityType)

  if (isWatchRequest(args) && typeof table !== 'string') {
    Tables.formatWatchableTable(table, {
      refreshCommand: args.command.replace(/--watch=true|-w=true|--watch-only=true|--watch|-w|--watch-only/g, ''),
      watchByDefault: true
    })
  }

  return table
}

/**
 * Special case: user requested a watchable table, and there is
 * not yet anything to display
 *
 */
function doGetEmptyTable(args: Commands.Arguments<KubeOptions>): KubeTableResponse {
  return Tables.formatWatchableTable(new Table({ body: [] }), {
    refreshCommand: args.command.replace(/--watch=true|-w=true|--watch-only=true|--watch|-w|--watch-only/g, ''),
    watchByDefault: true
  })
}

/**
 * kubectl get as entity response
 *
 */
export async function doGetEntity(args: Commands.Arguments<KubeOptions>, response: RawResponse): Promise<KubeResource> {
  try {
    const resource =
      formatOf(args) === 'json'
        ? JSON.parse(response.content.stdout)
        : (await import('js-yaml')).safeLoad(response.content.stdout)

    return Object.assign(resource, {
      modes: [],
      data: response.content.stdout
    })
  } catch (err) {
    console.error('trouble handling entity response', response.content.stdout)
    throw err
  }
}

/**
 * kubectl get as custom response
 *
 */
async function doGetCustom(args: Commands.Arguments<KubeOptions>, response: RawResponse): Promise<string> {
  return response.content.stdout
}

/**
 * This is the main handler for `kubectl get`. Here, we act as a
 * dispatcher: in `kubectl` a `get` can mean either get-as-table,
 * get-as-entity, or get-as-custom, depending on the `-o` flag.
 *
 */
async function doGet(args: Commands.Arguments<KubeOptions>): Promise<string | KubeResource | KubeTableResponse> {
  // first, we do the raw exec of the given command
  const response = await exec(args, prepareArgsForGet)

  if (response.content.code !== 0) {
    // raw exec yielded an error!
    if (isTableWatchRequest(args)) {
      // special case: user requested a watchable table, and there is
      // not yet anything to display
      return doGetEmptyTable(args)
    } else {
      const err: Errors.CodedError = new Error(response.content.stderr)
      err.code = response.content.code
      throw err
    }
  } else if (response.content.wasSentToPty) {
    return response.content.stdout
  } else if (isEntityRequest(args)) {
    // case 1: get-as-entity
    return doGetEntity(args, response)
  } else if (isTableRequest(args)) {
    // case 2: get-as-table
    return doGetTable(args, response)
  } else {
    // case 3: get-as-custom
    return doGetCustom(args, response)
  }
}

export default (commandTree: Commands.Registrar) => {
  commandTree.listen(`/${commandPrefix}/kubectl/get`, doGet, flags)
  commandTree.listen(`/${commandPrefix}/k/get`, doGet, flags)
}
