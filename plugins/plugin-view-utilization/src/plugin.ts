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

import { Registrar } from '@kui-shell/core'
import { defaultFlags, commandPrefix } from '@kui-shell/plugin-kubeui'

import { topContainer, topPod } from './controller/get-pod-data'
import topNode from './controller/get-node-data'

export default async (commandTree: Registrar) => {
  commandTree.override(`/${commandPrefix}/kubectl/top/node`, 'plugin-kubeui', topNode, defaultFlags)
  commandTree.override(`/${commandPrefix}/k/top/node`, 'plugin-kubeui', topNode, defaultFlags)

  commandTree.override(`/${commandPrefix}/kubectl/top/pod`, 'plugin-kubeui', topPod, defaultFlags)
  commandTree.override(`/${commandPrefix}/k/top/pod`, 'plugin-kubeui', topPod, defaultFlags)

  commandTree.listen(`/${commandPrefix}/kubectl/top/container`, topContainer, defaultFlags)
  commandTree.listen(`/${commandPrefix}/k/top/container`, topContainer, defaultFlags)
}
