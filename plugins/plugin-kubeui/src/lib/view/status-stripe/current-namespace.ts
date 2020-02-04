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

import { Tab, StatusStripeController, StatusTextWithIcon, eventBus } from '@kui-shell/core'

import { KubeContext } from '../../model/resource'
import { getCurrentContext } from '../../../controller/kubectl/contexts'

// @ icon
const icon =
  '<svg focusable="false" preserveAspectRatio="xMidYMid meet" style="will-change: transform;" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 32 32" aria-hidden="true"><path d="M16,3A12.92,12.92,0,0,0,3,16v1A13,13,0,0,0,16,30h7V28H16A11,11,0,0,1,5,17V16A10.94,10.94,0,0,1,16,5,10.64,10.64,0,0,1,27,16c0,3.59-1.4,5-3.66,5C21.76,21,21,19.71,21,18V10H19v1.94A3.84,3.84,0,0,0,15.5,10,5.48,5.48,0,0,0,10,15.44v2.12A5.48,5.48,0,0,0,15.5,23a4.28,4.28,0,0,0,4-2.46A4.35,4.35,0,0,0,23.41,23C26.48,23,29,21,29,16A12.72,12.72,0,0,0,16,3Zm3,14.56a3.5,3.5,0,0,1-7,0V15.44a3.5,3.5,0,0,1,7,0Z"></path><title>At</title></svg>'

/** @return a short string that we can fit into a context UI widget */
function renderContext(context: KubeContext): string {
  return context.metadata.namespace
}

/**
 * On default events (new tab, tab switch, command execution), we
 * will update the text element.
 *
 */
async function listener(tab: Tab, controller: StatusStripeController, fragment: StatusTextWithIcon) {
  try {
    const currentContext = await getCurrentContext(tab)
    eventBus.emit('/kubeui/context/current', currentContext)

    // render the current context into the UI
    fragment.text.innerText = currentContext === undefined ? '' : renderContext(currentContext)

    // only show normally if we succeed; see https://github.com/IBM/kui/issues/3537
    controller.showAs('normal')
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
  const fragment = {
    id: 'kui--plugin-kubeui--current-namespace',
    icon,
    iconIsNarrow: true,
    text: document.createElement('div'),
    onclick: {
      text: 'kubectl get namespaces'
    }
  }

  return {
    fragment,
    listener
  }
}
