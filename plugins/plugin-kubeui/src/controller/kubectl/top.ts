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

import { Arguments, Registrar } from '@kui-shell/core'

import flags from './flags'
import { exec } from './exec'
import commandPrefix from '../command-prefix'
import { KubeOptions } from './options'
import { KubeTableResponse } from '../../lib/view/formatTable'

import { doGetAsTable } from './get'

const verb = 'top'

/**
 * This is the main handler for `kubectl top`.
 *
 */
async function doTop(args: Arguments<KubeOptions>): Promise<KubeTableResponse> {
  // first, we do the raw exec of the given command
  const response = await exec(args)

  return doGetAsTable(args, response, verb)
}

export default (commandTree: Registrar) => {
  commandTree.listen(`/${commandPrefix}/kubectl/${verb}/node`, doTop, flags)
  commandTree.listen(`/${commandPrefix}/k/${verb}/node`, doTop, flags)
  commandTree.listen(`/${commandPrefix}/kubectl/${verb}/pod`, doTop, flags)
  commandTree.listen(`/${commandPrefix}/k/${verb}/pod`, doTop, flags)
}
