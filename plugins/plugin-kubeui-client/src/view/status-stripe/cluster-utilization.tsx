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

import Debug from 'debug'
import * as React from 'react'

import { Tab, getCurrentTab, i18n, wireToStandardEvents } from '@kui-shell/core'
import { ViewLevel, TextWithIconWidget } from '@kui-shell/plugin-client-common'
import { NodeSummary , BarColor, bar, barContainer} from '@kui-shell/plugin-view-utilization'

const debug = Debug('plugin-view-utilization/widgets/cluster-utilization')
const strings = i18n('plugin-view-utilization', 'widgets')
const icon = ''

interface State {
  container: HTMLElement
  cpuBar: HTMLElement
  memBar: HTMLElement
  viewLevel: ViewLevel
}

export default class ClusterUtilization extends React.PureComponent<{}, State> {
  public constructor(props = {}) {
    super(props)
    const container = barContainer()
    const cpuBar = bar(container, BarColor.CPU)
    const memBar = bar(container, BarColor.Memory)

    this.state = {
      container,
      cpuBar,
      memBar,
      viewLevel: 'hidden'
    }
  }

  private async reportClusterUtilization() {
    try {
      const tab = getCurrentTab()
      const { content: info } = await tab.REPL.rexec<NodeSummary>('kubectl top node-summary')

      const cpu = 100 * info.cpuFrac + '%'
      const mem = 100 * info.memFrac + '%'

      const { cpuBar, memBar } = this.state
      cpuBar.style.width = cpu
      cpuBar.title = strings('Cluster CPU', cpu)
      memBar.style.width = mem
      memBar.title = strings('Cluster Memory', mem)

      this.setState({
        cpuBar,
        memBar,
        viewLevel: 'normal' // only show normally if we succeed; see https://github.com/IBM/kui/issues/3537
      })

    } catch (err) {
      debug(err)
      // FIXME type isn't correct here, dunno why
      this.setState({
        viewLevel: 'hidden'
      })
    }
  }

  /**
   * Once we have mounted, we immediately check the current cpu utilization,
   * and schedule an update based on standard REPL events.
   *
   */
  public componentDidMount() {
    this.reportClusterUtilization()
    wireToStandardEvents(this.reportClusterUtilization.bind(this))
  }

  public render() {
    // FIXME <div> part is not correct
    return (
      <TextWithIconWidget
        text="FIXME"
        viewLevel={this.state.viewLevel}
        id="kui--plugin-view-utilization--cluster-utilization"
        textOnclick="kubectl top node"
      >
      <div> {this.state.cpuBar} </div>
      <div> {this.state.memBar} </div>
      </TextWithIconWidget>
    )
  }

}
