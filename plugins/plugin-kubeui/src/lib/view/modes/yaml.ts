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

import { ModeRegistration, Mode } from '@kui-shell/core/api/registrars'

import { Resource, KubeResource, isKubeResource } from '../../model/resource'

/**
 * Add a Containers mode button to the given modes model, if called
 * for by the given resource.
 *
 */
const yamlMode: ModeRegistration<KubeResource> = {
  when: (resource: KubeResource) => {
    return isKubeResource(resource)
  },
  mode: (command: string, resource: Resource): Mode => {
    return {
      mode: 'raw',
      label: 'YAML',
      direct: () => {
        return {
          content: resource.resource.data,
          contentType: 'yaml'
        }
      },
      order: 999
    }
  }
}

export default yamlMode
