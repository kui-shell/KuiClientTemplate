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
 * @return whether the given `LogEntryResource` has a `stacktrace`
 * property
 *
 */
function hasStackTrace(resource: LogEntryResource): boolean {
  return (
    isLogEntryResource(resource) &&
    resource.spec.entry.messageDetail !== undefined &&
    resource.spec.entry.messageDetail.stacktrace !== undefined
  )
}

/**
 * This is the `content` function for the Stack Trace mode. It returns
 * a bespoke HTMLElement.
 *
 */
function renderStackTrace(tab: Tab, resource: LogEntryResource) {
  const rows = document.createElement('div')
  rows.classList.add('padding-content', 'smaller-text')

  const traceLines = resource.spec.entry.messageDetail.stacktrace.split(/\n/)
  for (let idx = 0; idx < traceLines.length; idx += 2) {
    const l1 = document.createElement('pre')
    const l2 = document.createElement('pre')
    l1.innerText = traceLines[idx]
    l2.innerText = traceLines[idx + 1]
    rows.appendChild(l1)
    rows.appendChild(l2)

    l2.classList.add('sub-text', 'smaller-text')
  }

  return rows
}

/**
 * This is our mode model for the Stack Trace tab of a LogEntry resource
 *
 */
export default {
  when: hasStackTrace,
  mode: {
    mode: 'stack-trace',
    label: strings('Stack Trace'),
    content: renderStackTrace
  }
}
