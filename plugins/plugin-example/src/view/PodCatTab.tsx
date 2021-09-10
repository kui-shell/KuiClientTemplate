/*
 * Copyright 2019 The Kubernetes Authors
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

import { dump } from 'js-yaml'
import { ModeRegistration } from '@kui-shell/core'
import { Pod, isPod } from '@kui-shell/plugin-kubectl'

/** Mode identifier */
export const mode = 'cat'

/** Mode label; intentionally no i18n */
export const label = 'Cat'

/** Optional: You can force this tab to be inserted in a particular order */
export const order = undefined

/** Generate a yaml string */
function catContent(pod: Pod) {
  return dump({
    animal: '🐱'
  })
}

/**
 * The YAML mode applies to all KubeResources, and simply extracts the
 * raw `data` field from the resource; note how we indicate that this
 * raw data has a yaml content type.
 *
 */
const funMode: ModeRegistration<Pod> = {
  when: isPod,
  mode: {
    mode,
    label,

    content: (_, pod: Pod) => ({
      content: catContent(pod),
      contentType: 'yaml'
    }),

    // traits:
    order
  }
}

export default funMode
