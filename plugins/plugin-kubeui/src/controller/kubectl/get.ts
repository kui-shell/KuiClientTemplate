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

import { Arguments, Registrar } from '@kui-shell/core/api/commands'
import { CodedError } from '@kui-shell/core/api/errors'
import Tables from '@kui-shell/core/api/tables'
import { Table } from '@kui-shell/core/api/table-models'

import flags from './flags'
import { exec } from './exec'
import { RawResponse } from './response'
import commandPrefix from '../command-prefix'
import extractAppAndName from '../../lib/util/name'
import { KubeResource } from '../../lib/model/resource'
import { KubeOptions, isEntityRequest, isTableRequest, formatOf, isWatchRequest, isTableWatchRequest } from './options'
import { stringToTable, KubeTableResponse, isKubeTableResponse } from '../../lib/view/formatTable'

/**
 * For now, we handle watch ourselves, so strip these options off the command line
 *
 */
function prepareArgsForGet(args: Arguments<KubeOptions>) {
  const stripThese = ['-w=true', '--watch=true', '--watch-only=true', '-w', '--watch', '--watch-only']

  const idx = args.command.indexOf(' get ') + ' get '.length
  const pre = args.command.slice(0, idx - 1)
  const post = args.command.slice(idx - 1)
  return pre + stripThese.reduce((cmd, strip) => cmd.replace(new RegExp(`(\\s)${strip}`), '$1'), post)
}

/**
 * kubectl get as table response
 *
 */
function doGetTable(args: Arguments<KubeOptions>, response: RawResponse): KubeTableResponse {
  const {
    content: { stderr, stdout }
  } = response

  const command = 'kubectl'
  const verb = 'get'
  const entityType = args.argvNoOptions[args.argvNoOptions.indexOf(verb) + 1]

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
 * nothing yet to display
 *
 */
function doGetEmptyTable(args: Arguments<KubeOptions>): KubeTableResponse {
  return Tables.formatWatchableTable(new Table({ body: [] }), {
    refreshCommand: args.command.replace(/--watch=true|-w=true|--watch-only=true|--watch|-w|--watch-only/g, ''),
    watchByDefault: true
  })
}

/**
 * kubectl get as entity response
 *
 */
export async function doGetEntity(args: Arguments<KubeOptions>, response: RawResponse): Promise<KubeResource> {
  try {
    // this is the raw data string we get from `kubectl`
    const data = response.content.stdout

    // parse the raw response; the parser we use depends on whether
    // the user asked for JSON or for YAML
    const resource = formatOf(args) === 'json' ? JSON.parse(data) : (await import('js-yaml')).safeLoad(data)

    // attempt to separate out the app and generated parts of the resource name
    const { name: prettyName, nameHash } = extractAppAndName(resource)

    return Object.assign(resource, {
      prettyName,
      nameHash,
      originatingCommand: args.command,
      modes: [], // this tells Kui that we want the response to be interpreted as a MultiModalResponse
      data // also include the raw, uninterpreted data string we got back
    })
  } catch (err) {
    console.error('error handling entity response; raw=', response.content.stdout)
    throw err
  }
}

/**
 * kubectl get as custom response
 *
 */
async function doGetCustom(args: Arguments<KubeOptions>, response: RawResponse): Promise<string> {
  return response.content.stdout
}

/**
 * This is the main handler for `kubectl get`. Here, we act as a
 * dispatcher: in `kubectl` a `get` can mean either get-as-table,
 * get-as-entity, or get-as-custom, depending on the `-o` flag.
 *
 */
async function doGet(args: Arguments<KubeOptions>): Promise<string | KubeResource | KubeTableResponse> {
  // first, we do the raw exec of the given command
  const response = await exec(args, prepareArgsForGet).catch((err: CodedError) => {
    if (err.statusCode === 0 && err.code === 404 && isTableWatchRequest(args)) {
      // Notes:
      // err.statusCode === 0 means this was "normal error" (i.e. kubectl didn't bail)
      // err.code === 404 means that raw.ts thinks this error was "not found" related
      // if those hold, and the user asked us to watch a table, then
      // respond with an empty table, rather than with the error
      return doGetEmptyTable(args)
    } else {
      // Notes: we are using statusCode internally to this plugin;
      // delete it before rethrowing the error, because the core would
      // otherwise interpret the statusCode as being meaningful to the
      // outside world
      delete err.statusCode
      throw err
    }
  })

  if (isKubeTableResponse(response)) {
    return response
  } else if (response.content.code !== 0) {
    // raw exec yielded an error!
    if (isTableWatchRequest(args)) {
      // special case: user requested a watchable table, and there is
      // not yet anything to display
      return doGetEmptyTable(args)
    } else {
      const err: CodedError = new Error(response.content.stderr)
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

export default (commandTree: Registrar) => {
  commandTree.listen(`/${commandPrefix}/kubectl/get`, doGet, flags)
  commandTree.listen(`/${commandPrefix}/k/get`, doGet, flags)
}
