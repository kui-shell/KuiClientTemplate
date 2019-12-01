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

import { Arguments } from '@kui-shell/core/api/commands'
import { renderHelp } from '@kui-shell/plugin-kubeui'

import commandPrefix from '../command-prefix'

/** is the given string `str` the `helm` command? */
const isPlainHelm = (args: Arguments) =>
  (args.argvNoOptions.length === 1 && /^helm$/.test(args.argvNoOptions[0])) ||
  (args.argvNoOptions.length === 2 && args.argvNoOptions[0] === commandPrefix && /^helm$/.test(args.argvNoOptions[1]))

export function isUsage(args: Arguments) {
  return (
    args.parsedOptions.help ||
    args.parsedOptions.h ||
    isPlainHelm(args) ||
    args.argvNoOptions[1] === 'help' ||
    (args.argvNoOptions[0] === commandPrefix && args.argvNoOptions[2] === 'help')
  )
}

export function doHelp(response: string): void {
  throw renderHelp(response, 'helm', 'get', 500)
}

export function doHelpIfRequested(args: Arguments, response: string) {
  if (isUsage(args)) {
    doHelp(response)
  } else {
    return response
  }
}
