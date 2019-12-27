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

import { BadgeRegistration } from '@kui-shell/core'
import { LogEntryResource, isLogEntryResource } from '../models/resource'

function hasScope(resource: LogEntryResource) {
  return isLogEntryResource(resource) && resource.spec.entry.detail1Key === 'Logger'
}

const levelBadge: BadgeRegistration<LogEntryResource> = {
  when: hasScope,
  badge: (resource: LogEntryResource) => {
    const scope = resource.spec.entry.detail1
    return {
      title: scope,
      css: 'scope'
    }
  }
}

export default levelBadge
