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

import { i18n, Tab, Table, ModeRegistration } from '@kui-shell/core'

import { CustomResourceDefinition, isCustomResourceDefinition } from '../../model/resource'
import { command } from './show-crd-managed-resources'

const strings = i18n('plugin-kubeui')

/**
 * Extract the events
 *
 */
async function content(tab: Tab, crd: CustomResourceDefinition) {
  console.error(
    '!!!!! ',
    `${command(tab, crd)} -o custom-columns=KIND:.kind`,
    await tab.REPL.qexec<Table>(`${command(tab, crd)} -o custom-columns=NAME:.metadata.name`)
  )
  const [{ safeDump }, { body: resources }] = await Promise.all([
    import('js-yaml'),
    tab.REPL.qexec<Table>(`${command(tab, crd)} -o custom-columns=NAME:.metadata.name`)
  ])

  const { group, version, scope } = crd.spec
  const kind = crd.spec.names.kind
  const resourceCount = resources.length

  return {
    content: safeDump({ scope, group, version, kind, 'resource count': resourceCount }),
    contentType: 'yaml'
  }
}

/**
 * Add a Events mode button to the given modes model, if called for by
 * the given resource.
 *
 */
const mode: ModeRegistration<CustomResourceDefinition> = {
  when: isCustomResourceDefinition,
  mode: {
    mode: 'summary',
    label: strings('summary'),
    content,
    priority: 10 // override default Summary
  }
}

export default mode
