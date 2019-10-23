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

import raw from './controller/kubectl/raw'
import kubectlGet from './controller/kubectl/get'
import kubectlCreate from './controller/kubectl/create'
import kubectlDelete from './controller/kubectl/delete'
import kubectlStatus from './controller/kubectl/status'
import kubectlContexts from './controller/kubectl/contexts'
import catchall from './controller/kubectl/catchall'

export default async (commandTree: Commands.Registrar) => {
  return Promise.all([
    raw(commandTree),
    kubectlGet(commandTree),
    kubectlCreate(commandTree),
    kubectlDelete(commandTree),
    kubectlStatus(commandTree),
    kubectlContexts(commandTree),
    catchall(commandTree)
  ])
}
