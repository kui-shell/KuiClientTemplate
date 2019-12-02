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
import { Arguments, Registrar } from '@kui-shell/core/api/commands'
import { KubeOptions } from '@kui-shell/plugin-kubeui'

import doExecWithStdout from './exec'
import { doHelpIfRequested } from './help'
import commandPrefix from '../command-prefix'

/** is the given string `str` the `helm` command? */
const isHelm = (str: string) => /^helm$/.test(str)

export default (registrar: Registrar) => {
  if (Capabilities.inBrowser() && !Capabilities.hasProxy()) {
    // skipping catchall registration: in browser and no remote proxy to support it
    return
  }

  //
  // if we aren't running in a browser, then pass any command not
  // found exceptions to the outer shell
  //
  registrar.catchall(
    (argv: string[]) => {
      return isHelm(argv[0]) || (argv[0] === commandPrefix && isHelm(argv[1]))
    },
    async (args: Arguments<KubeOptions>) => {
      return doHelpIfRequested(args, await doExecWithStdout(args))
    },
    1, // priority
    { inBrowserOk: true }
  )
}
