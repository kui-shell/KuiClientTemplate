/*
 * Copyright 2018-19 IBM Corporation
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

import { Common, CLI, ReplExpect, SidecarExpect, Selectors, Util } from '@kui-shell/test'
import {
  waitForRed,
  waitForGreen,
  defaultModeForGet,
  createNS,
  allocateNS,
  deleteNS
} from '@kui-shell/plugin-kubeui/tests/lib/k8s/utils'

import { dirname } from 'path'
const ROOT = dirname(require.resolve('@kui-shell/plugin-kubeui/tests/package.json'))

describe(`kubectl apply crd ${process.env.MOCHA_RUN_TARGET || ''}`, function(this: Common.ISuite) {
  before(Common.before(this))
  after(Common.after(this))

  const ns: string = createNS()
  const inNamespace = `-n ${ns}`
  const crdName = 'crontabs.stable.example.com'
  const kind = 'CustomResourceDefinition'
  const apiGroup = 'apiextensions.k8s.io'

  allocateNS(this, ns)

  it(`should create custom resource definition from file via "kubectl apply -f"`, async () => {
    try {
      console.error('kubectl apply crd 1')
      const selector = await CLI.command(`kubectl apply -f ${ROOT}/data/k8s/crd.yaml ${inNamespace}`, this.app)
        .then(ReplExpect.okWithCustom({ selector: Selectors.BY_NAME(crdName) }))
        .catch(Common.oops(this))

      // wait for the badge to become green
      console.error('kubectl apply crd 2')
      await waitForGreen(this.app, selector)

      // now click on the table row
      console.error('kubectl apply crd 3')
      await this.app.client.click(`${selector} .clickable`)
      await SidecarExpect.open(this.app)
        .then(SidecarExpect.mode(defaultModeForGet))
        .then(SidecarExpect.showing(crdName))

      let idx = 0
      await this.app.client.waitUntil(async () => {
        const text = await Util.getValueFromMonaco(this.app)
        if (++idx > 5) {
          console.error(`still waiting for yaml in ${this.title}`, text)
        }

        return Promise.resolve(text).then(
          Util.expectYAMLSubset(
            {
              kind: 'CronTab'
            },
            false
          )
        )
      })
    } catch (err) {
      return Common.oops(this, true)(err)
    }
  })

  it(`should switch to last applied tab of custom resource definitions`, async () => {
    try {
      // make sure we have a last applied tab
      console.error('kubectl apply crd 4')
      await this.app.client.waitForVisible(Selectors.SIDECAR_MODE_BUTTON('last applied'))
      await this.app.client.click(Selectors.SIDECAR_MODE_BUTTON('last applied'))
      await this.app.client.waitForVisible(Selectors.SIDECAR_MODE_BUTTON_SELECTED('last applied'))

      let idx = 0
      console.error('kubectl apply crd 5')
      await this.app.client.waitUntil(async () => {
        const text = await Util.getValueFromMonaco(this.app)
        if (++idx > 5) {
          console.error(`still waiting for yaml in ${this.title}`, text)
        }

        return Promise.resolve(text).then(
          Util.expectYAMLSubset(
            {
              apiVersion: 'apiextensions.k8s.io/v1beta1',
              kind: 'CustomResourceDefinition',
              metadata: {
                name: crdName
              }
            },
            false
          )
        )
      })
      console.error('kubectl apply crd 6')
    } catch (err) {
      return Common.oops(this, true)(err)
    }
  })

  it('should open crd in sidecar, then click on Show Resources button', async () => {
    try {
      const res = await CLI.command(`kubectl get ${kind}.${apiGroup} -n ${ns} ${crdName} -o yaml`, this.app)

      console.error('kubectl apply crd 7')
      await Promise.resolve(res)
        .then(ReplExpect.justOK)
        .then(SidecarExpect.open)
        .then(SidecarExpect.showing(crdName))
        .catch(Common.oops(this, true))

      await this.app.client.waitForVisible(Selectors.SIDECAR_MODE_BUTTON('show-crd-resources'))
      await this.app.client.click(Selectors.SIDECAR_MODE_BUTTON('show-crd-resources'))

      await Promise.resolve({ app: this.app, count: res.count + 1 }).then(
        ReplExpect.okWithCustom({ selector: Selectors.BY_NAME(crdName) })
      )
    } catch (err) {
      await Common.oops(this, true)(err)
    }
  })

  it(`should delete the custom resource definition from URL via kubectl`, () => {
    return CLI.command(`kubectl delete -f ${ROOT}/data/k8s/crd.yaml ${inNamespace}`, this.app)
      .then(ReplExpect.okWithCustom({ selector: Selectors.BY_NAME(crdName) }))
      .then(selector => waitForRed(this.app, selector))
      .catch(Common.oops(this, true))
  })

  deleteNS(this, ns)
})
