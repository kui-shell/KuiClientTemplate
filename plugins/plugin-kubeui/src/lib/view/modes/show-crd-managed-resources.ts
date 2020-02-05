/*
 * Copyright 2020 IBM Corporation
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

import { i18n, Tab, ModeRegistration } from '@kui-shell/core'

import { CustomResourceDefinition, isCustomResourceDefinition } from '../../model/resource'

const strings = i18n('plugin-kubeui')

/**
 * Extract the events
 *
 */
export function command(tab: Tab, crd: CustomResourceDefinition) {
  return `kubectl get ${tab.REPL.encodeComponent(crd.metadata.name)}`
}

/**
 * Add a Events mode button to the given modes model, if called for by
 * the given resource.
 *
 */
const mode: ModeRegistration<CustomResourceDefinition> = {
  when: isCustomResourceDefinition,
  mode: {
    mode: 'show-crd-resources',
    label: strings('Show Resources'),
    command,
    kind: 'drilldown'
  }
}

export default mode
