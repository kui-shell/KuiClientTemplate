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

import { Common, CLI, ReplExpect, SidecarExpect, Selectors } from '@kui-shell/test'
import { createNS, allocateNS, deleteNS } from '@kui-shell/plugin-kubeui/tests/lib/k8s/utils'

import { readFileSync } from 'fs'
import { dirname, join } from 'path'
const ROOT = dirname(require.resolve('@kui-shell/plugin-kubeui/tests/package.json'))
const inputBuffer = readFileSync(join(ROOT, 'data/k8s/event-generator.yaml'))
const inputEncoded = inputBuffer.toString('base64')

const podName = 'eventgen'
const sleepTime = 10

const synonyms = ['kubectl']

/** sleep for N seconds */
function sleep(N: number) {
  return new Promise(resolve => setTimeout(resolve, N * 1000))
}

describe(`kubectl get events ${process.env.MOCHA_RUN_TARGET || ''}`, function(this: Common.ISuite) {
  before(Common.before(this))
  after(Common.after(this))

  synonyms.forEach(kubectl => {
    const ns: string = createNS()
    allocateNS(this, ns)

    /** error handling starts */
    it('should create pod that generates events', () =>
      CLI.command(`echo ${inputEncoded} | base64 --decode | kubectl create -f - -n ${ns}`, this.app)
        .then(ReplExpect.okWithString(podName))
        .catch(Common.oops(this, true)))

    it('should open pod in sidecar, then click on events button', async () => {
      try {
        const res = await CLI.command(`${kubectl} get pod ${podName} -n ${ns} -o yaml`, this.app)

        await Promise.resolve(res)
          .then(ReplExpect.justOK)
          .then(SidecarExpect.open)
          .then(SidecarExpect.showing(podName))
          .catch(Common.oops(this, true))

        await sleep(sleepTime)

        await this.app.client.waitForVisible(Selectors.SIDECAR_MODE_BUTTON('events'))
        await this.app.client.click(Selectors.SIDECAR_MODE_BUTTON('events'))

        await Promise.resolve({ app: this.app, count: res.count + 1 }).then(ReplExpect.okWithAny)

        const table = `${Selectors.OUTPUT_N(res.count + 1)} .result-table`

        // test events table has correct header
        const header = ['TYPE', 'REASON', 'LAST SEEN', 'FIRST SEEN', 'FROM', 'MESSAGE']
        header.forEach(async _header => {
          await this.app.client.waitForExist(`${table} .header-row .header-cell .cell-inner[data-key="${_header}"]`)
        })

        await this.app.client.click(`${table} tr:first-child .clickable`)

        await SidecarExpect.open(this.app).then(SidecarExpect.kind('EVENT'))
      } catch (err) {
        await SidecarExpect.open(this.app).then(SidecarExpect.kind('EVENT'))
        await Common.oops(this, true)
      }
    })

    it('should click on Show Involved Object', async () => {
      await this.app.client.waitForVisible(Selectors.SIDECAR_MODE_BUTTON('involvedObject'))
      await this.app.client.click(Selectors.SIDECAR_MODE_BUTTON('involvedObject'))
      await SidecarExpect.open(this.app)
        .then(SidecarExpect.showing(podName))
        .then(SidecarExpect.kind('POD'))
    })

    deleteNS(this, ns)
  })
})
