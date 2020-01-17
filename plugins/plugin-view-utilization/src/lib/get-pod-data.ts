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

import { Arguments, Table, Row } from '@kui-shell/core'

import parseAsSize from './parse-as-size'

/**
 *
 */
function parse(data: string, raw = false): Table {
  const header = {
    name: 'Container',
    attributes: [
      { value: 'Pod' },
      { value: 'Namespace' },
      { value: 'Node IP' },
      { value: 'CPU Requests' },
      { value: 'Memory Requests' },
      { value: 'CPU Limits' },
      { value: 'Memory Limits' }
    ]
  }

  const body = data.split(/\n/).map(line => {
    const [name, ns, container, ip, cpuRequests, memoryRequests, cpuLimits, memoryLimits] = line.split(/\t/)

    const row: Row = {
      type: 'pod',
      name: container,
      attributes: [
        { key: 'Pod', value: name },
        { key: 'Namespace', value: ns },
        { key: 'Node IP', value: ip },
        { key: 'cpu requests', value: raw ? cpuRequests : parseAsSize(cpuRequests) },
        { key: 'memory requests', value: raw ? memoryRequests : parseAsSize(memoryRequests) },
        { key: 'cpu limits', value: raw ? cpuLimits : parseAsSize(cpuLimits) },
        { key: 'memory limits', value: raw ? memoryLimits : parseAsSize(memoryLimits) }
      ]
    }

    return row
  })

  return {
    title: 'Pods',
    header,
    body
  }
}

export default async function getNodeData(args: Arguments, raw = false): Promise<Table> {
  const { parsedOptions: options, REPL } = args

  const namespaceOption = options.n || options.namespace
  const namespace = namespaceOption ? `--namespace=${namespaceOption}` : '--all-namespaces'

  const context = options.context ? `--context=${options.context}` : ''

  const template =
    '{{range.items}}{{$podName:=.metadata.name}}{{$namespace:=.metadata.namespace}}{{$node:=.spec.nodeName}}{{range.spec.containers}}{{$podName}}{{"\\\\t"}}{{$namespace}}{{"\\\\t"}}{{.name}}{{"\\\\t"}}{{$node}}{{"\\\\t"}}{{if.resources.requests.cpu}}{{.resources.requests.cpu}}{{else}}0{{end}}{{"\\\t"}}{{if.resources.requests.memory}}{{.resources.requests.memory}}{{else}}0Ki{{end}}{{"\\\\t"}}{{if.resources.limits.cpu}}{{.resources.limits.cpu}}{{else}}0{{end}}{{"\\t"}}{{if.resources.limits.memory}}{{.resources.limits.memory}}{{else}}0Ki{{end}}{{"\\\\n"}}{{end}}{{end}}'

  const cmd = `kubectl ${context} get pod ${namespace} --field-selector=status.phase=Running -o=go-template --template=${template}`
  return parse(await REPL.qexec<string>(cmd), raw)
}
