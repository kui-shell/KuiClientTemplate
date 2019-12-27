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

import { i18n } from '@kui-shell/core'
import { KubeResource } from '@kui-shell/plugin-kubeui'

import renderLogs from '../renderers/table'

const strings = i18n('plugin-logui')

/**
 * @return whether the given resource represents a list of logs
 *
 */
function isLogs(resource: KubeResource): boolean {
  return resource.kind === 'logs'
}

/**
 * This is our mode model for the Logs tab of a Logs resource
 *
 */
export default {
  when: isLogs,
  mode: {
    mode: 'logs',
    label: strings('Logs'),
    content: renderLogs,
    priority: 10
  }
}
