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

import { i18n, Tab, Table } from '@kui-shell/core'
import { doExecRaw, KubeResource } from '@kui-shell/plugin-kubeui'

import { formatAsTable } from '../renderers/table'

const strings = i18n('plugin-logui')

/**
 * @return whether the given resource has a logs
 *
 */
function isLogs(resource: KubeResource): boolean {
  return resource.kind === 'logs'
}

/**
 * Unlike for the `logs` mode, we don't yet have the data for the
 * `previous` mode. Thus, we first fetch it (by modifying the
 * `originatingCommand` to add `--previous`), and then pass that raw
 * logs data to `formatAsTable`. That function gives us back a Table.
 *
 */
async function renderPrevious(tab: Tab, resource: KubeResource): Promise<Table> {
  return formatAsTable(await doExecRaw(`${resource.originatingCommand} --previous`, {}, {}), resource.metadata)
}

/**
 * This is our mode model for the Previous tab of a Logs resource
 *
 */
export default {
  when: isLogs,
  mode: {
    mode: 'previous',
    label: strings('Previous'),
    content: renderPrevious,
    priority: 10
  }
}
