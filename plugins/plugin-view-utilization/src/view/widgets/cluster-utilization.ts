/*
 * Copyright 2019-2020 IBM Corporation
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

import { Tab, Table, StatusStripeController, StatusTextWithIcon, i18n } from '@kui-shell/core'

import { BarColor, bar, barContainer } from '../bar'
import { percentLimHeader } from '../../controller/utilization/cluster'

const strings = i18n('plugin-view-utilization', 'widgets')
const icon = ''

/**
 * The model for our bars
 *
 */
interface MyFragment extends StatusTextWithIcon {
  cpuBar: HTMLElement
  memBar: HTMLElement
}

/**
 * Render our pair of bars
 *
 */
function bars() {
  const container = barContainer()
  const cpuBar = bar(container, BarColor.CPU)
  const memBar = bar(container, BarColor.Memory)

  return { container, cpuBar, memBar }
}

/**
 * On default events (new tab, tab switch, command execution), we
 * will update the text element.
 *
 */
async function listener(tab: Tab, controller: StatusStripeController<MyFragment>, fragment: MyFragment) {
  try {
    controller.showAs('normal')
    const info = await tab.REPL.qexec<Table>(`utilization cluster`)

    const idx = info.header.attributes.findIndex(_ => _.key === percentLimHeader)
    const cpu = info.body[0].attributes[idx].value
    const mem = info.body[1].attributes[idx].value

    fragment.cpuBar.style.width = cpu
    fragment.cpuBar.title = strings('Cluster CPU', cpu)

    fragment.memBar.style.width = mem
    fragment.memBar.title = strings('Cluster Memory', mem)
  } catch (err) {
    controller.showAs('hidden')
  }
}

/**
 * @return our fragment spec: an icon, a text container, and onclick
 * handlers
 *
 */
export default function() {
  const { container: text, cpuBar, memBar } = bars()

  const fragment = {
    id: 'kui--plugin-view-utilization--cluster-utilization',
    icon,
    text,
    onclick: {
      text: 'utilization cluster'
    },
    cpuBar,
    memBar
  }

  return {
    fragment,
    listener
  }
}
