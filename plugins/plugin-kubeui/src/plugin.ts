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

import contexts from './controller/kubectl/contexts'
import create from './controller/kubectl/create'
import kdelete from './controller/kubectl/delete'
import describe from './controller/kubectl/describe'
import kget from './controller/kubectl/get'
import logs from './controller/kubectl/logs'
import status from './controller/kubectl/status'
import raw from './controller/kubectl/raw'
import run from './controller/kubectl/run'
import catchall from './controller/kubectl/catchall'

export default async (commandTree: Commands.Registrar) => {
  return Promise.all([
    contexts(commandTree),
    create(commandTree),
    kdelete(commandTree),
    describe(commandTree),
    kget(commandTree),
    logs(commandTree),
    raw(commandTree),
    run(commandTree),
    status(commandTree),
    catchall(commandTree)
  ])
}
