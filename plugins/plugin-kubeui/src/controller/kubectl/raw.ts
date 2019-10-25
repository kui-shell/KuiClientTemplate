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

import * as Debug from 'debug'
import { spawn } from 'child_process'

import { inBrowser } from '@kui-shell/core/api/capabilities'
import Commands from '@kui-shell/core/api/commands'
import Errors from '@kui-shell/core/api/errors'

import flags from './flags'
import RawResponse from './response'
import commandPrefix from '../command-prefix'

const debug = Debug('plugin-kubeui/controller/kubectl/raw')

const doRaw = (args: Commands.Arguments): Promise<RawResponse> =>
  new Promise((resolve, reject) => {
    const env = Object.assign({}, !inBrowser() ? process.env : {}, args.execOptions.env)
    delete env.DEBUG

    const child = spawn('kubectl', args.argv.slice(1), { env })

    // this is needed e.g. to handle ENOENT; otherwise the kui process may die with an uncaught exception
    child.on('error', (err: Error) => {
      console.error('error spawning kubectl', err)
      reject(err)
    })

    let stdout = ''
    child.stdout.on('data', data => {
      stdout += data.toString()
    })

    let stderr = ''
    child.stderr.on('data', data => {
      stderr += data.toString()
    })

    child.on('close', async (code: number) => {
      // debug('exec close', code)
      // debug('exec stdout', out)
      if (stderr.length > 0 || code !== 0) {
        debug('exec has stderr with code %s', code)
        debug('exec stderr command', args.command)
        debug('exec stderr', stderr)
      }

      const noResources = stderr.match(/no resources found/i)
      if (code !== 0 || noResources) {
        const message = stderr
        const fileNotFound = message.match(/error: the path/)
        const codeForREPL =
          noResources || message.match(/not found/i) || message.match(/doesn't have/i)
            ? 404
            : message.match(/already exists/i)
            ? 409
            : fileNotFound
            ? 412
            : 500

        if (args.execOptions.failWithUsage) {
          reject(new Error(undefined))
        } else {
          const error: Errors.CodedError = new Error(message)
          error.code = codeForREPL
          reject(error)
        }
      } else {
        resolve({
          content: {
            code,
            stdout,
            stderr
          }
        })
      }
    })
  })

export default async (commandTree: Commands.Registrar) => {
  commandTree.listen(
    `/${commandPrefix}/_kubectl`,
    doRaw,
    Object.assign({}, flags, { requiresLocal: true, inBrowserOk: false })
  )
}
