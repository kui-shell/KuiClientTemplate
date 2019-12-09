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

import Debug from 'debug'
import { PreloadRegistrar } from '@kui-shell/core'

import podMode from './lib/view/modes/pods'
import yamlMode from './lib/view/modes/yaml'
import summaryMode from './lib/view/modes/summary'
import containersMode from './lib/view/modes/containers'
import lastAppliedMode from './lib/view/modes/last-applied'
import deleteResourceMode from './lib/view/modes/crud'
import involvedObjectMode from './lib/view/modes/involved-object'
import { eventsMode, eventsBadge } from './lib/view/modes/events'

import tabCompletionProvider from './lib/tab-completion'

export default async (registrar: PreloadRegistrar) => {
  // register modes
  await registrar.registerModes(
    podMode,
    yamlMode,
    eventsMode,
    summaryMode,
    containersMode,
    lastAppliedMode,
    deleteResourceMode,
    involvedObjectMode
  )

  // register badges
  await registrar.registerBadges(eventsBadge)

  // register tab completion provider
  try {
    tabCompletionProvider()
  } catch (err) {
    // don't utterly fail if we can't install the tab completion
    // https://github.com/IBM/kui/issues/2793
    const debug = Debug('plugins/kubeui/preload')
    debug('error installing kubeui tab-completion extensions', err)
  }
}
