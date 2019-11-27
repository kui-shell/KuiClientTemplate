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
import { doExecRaw, preprocessTable, formatTable, KubeOptions } from '@kui-shell/plugin-kubeui'

import commandPrefix from '../command-prefix'

async function doList({ command, parsedOptions }: Arguments<KubeOptions>) {
  const response = await doExecRaw(command)
  const preTables = preprocessTable(response.split(/^(?=LAST SEEN|NAMESPACE|NAME\s+)/m))

  return formatTable('helm', 'get', undefined, parsedOptions, preTables[0])
}

export default (registrar: Registrar) => {
  registrar.listen(`/${commandPrefix}/helm/list`, doList, {
    inBrowserOk: true
  })

  registrar.listen(`/${commandPrefix}/helm/ls`, doList, {
    inBrowserOk: true
  })
}
