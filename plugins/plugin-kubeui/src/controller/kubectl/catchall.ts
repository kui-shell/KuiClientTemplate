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

import Capabilities from '@kui-shell/core/api/capabilities'
import Commands from '@kui-shell/core/api/commands'

import { doExecWithPty } from './exec'
import commandPrefix from '../command-prefix'

/** is the given string `str` the `kubectl` command? */
const isKubectl = (str: string) => /^k(ubectl)?$/.test(str)

export default (commandTree: Commands.Registrar) => {
  if (Capabilities.inBrowser() && !Capabilities.hasProxy()) {
    // skipping catchall registration: in browser and no remote proxy to support it
    return
  }

  //
  // if we aren't running in a browser, then pass any command not
  // found exceptions to the outer shell
  //
  commandTree.catchall(
    (argv: string[]) => {
      return isKubectl(argv[0]) || (argv[0] === commandPrefix && isKubectl(argv[1]))
    },
    doExecWithPty,
    1, // priority
    { inBrowserOk: true }
  )
}
