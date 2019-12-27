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

import { KubeResource, KubeResourceWithSummary, InvolvedObject } from '@kui-shell/plugin-kubeui'

import { LogEntry } from './entry'
import apiVersion from '../controller/kubectl/apiVersion'
export { apiVersion }

export const kind = 'LogEntry'

interface LogEntryOverrides extends KubeResourceWithSummary {
  apiVersion
  kind
  isSimulacrum: true
  originatingCommand: undefined
  spec: {
    displayName?: string
    entry: LogEntry
  }
}

export type LogEntryResource = LogEntryOverrides & InvolvedObject

export function isLogEntryResource(resource: KubeResource): resource is LogEntryResource {
  return resource.apiVersion === apiVersion && resource.kind === kind
}

export async function resourceFromLogEntry(
  logLine: LogEntry,
  { involvedObject }: InvolvedObject
): Promise<LogEntryResource> {
  const { safeDump } = await import('js-yaml')

  return {
    apiVersion,
    kind,
    isSimulacrum: true,
    originatingCommand: undefined,
    metadata: {
      name: involvedObject.name,
      namespace: involvedObject.namespace
    },
    spec: {
      entry: logLine
    },
    involvedObject,
    data: safeDump(logLine),
    summary: {
      content: logLine.message
    }
  }
}
