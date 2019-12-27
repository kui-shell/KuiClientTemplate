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

import { i18n, Tab } from '@kui-shell/core'
import { LogEntryResource, isLogEntryResource } from '../models/resource'

const strings = i18n('plugin-logui')

/**
 * @return whether the given resource represents a list of logs
 *
 */
function hasError(resource: LogEntryResource): boolean {
  return (
    isLogEntryResource(resource) &&
    resource.spec.entry.messageDetail !== undefined &&
    resource.spec.entry.messageDetail.error !== undefined
  )
}

function renderError(tab: Tab, resource: LogEntryResource) {
  return resource.spec.entry.messageDetail.error
}

/**
 * This is our mode model for the Logs tab of a Logs resource
 *
 */
export default {
  when: hasError,
  mode: {
    mode: 'error-verbose',
    label: strings('Error'),
    content: renderError,
    order: -2
  }
}
