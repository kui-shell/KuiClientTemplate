/*
 * Copyright 2020 The Kubernetes Authors
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

import React from 'react'
import { ModeRegistration } from '@kui-shell/core'
import { KubeResource, isKubeResource } from '@kui-shell/plugin-kubectl'

/** Mode identifier */
const mode = 'dog-button'

/** Mode label; intentionally no i18n */
export const label = 'Dog'

/** Add a Dog button to every Kubernetes resource */
const dogButton: ModeRegistration<KubeResource> = {
  when: isKubeResource,
  mode: {
    mode,
    label,
    icon: <span>🐶</span>,

    // we want to execute the command in place of the current block,
    // rather than in a new block
    // inPlace: true,

    kind: 'drilldown',
    command: (_, resource: KubeResource, args: { argvNoOptions: string[] }) => (
      'echo 🐶'
    )
  }
}

export default dogButton
