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

import { isTable, Arguments, Registrar, Table, Row, Cell, ExecType } from '@kui-shell/core'

import flags from './flags'
import { getCurrentContext } from './contexts'
import commandPrefix from '../command-prefix'
import { doGet, doGetAsTable, rawGet } from './get'
import { KubeOptions, isTableRequest, isWatchRequest } from './options'

import { summarizeNamespaceOnSwitch } from '@kui-shell/client/config.d/kubectl.json'

/**
 * Special table for namespaces
 *
 */
async function doGetNamespaceTable(args: Arguments<KubeOptions>) {
  const [
    baseTable,
    {
      metadata: { namespace: currentNamespace }
    }
  ] = await Promise.all([doGetAsTable(args, await rawGet(args)), getCurrentContext(args.tab)])

  // user asked for a table, and *did not* ask for a watchable table?
  // then decorate the table as a row-selectable table
  if (isTable(baseTable)) {
    const augmentedTable = Object.assign({}, baseTable, {
      header: {
        name: 'CURRENT',
        css: baseTable.header.css,
        outerCSS: baseTable.header.outerCSS,
        attributes: [
          {
            key: baseTable.header.key,
            value: baseTable.header.name,
            css: baseTable.header.css,
            outerCSS: baseTable.header.outerCSS
          } as Cell
        ].concat(baseTable.header.attributes)
      },
      body: baseTable.body.map(row => {
        const ns = row.name
        const isSelected = ns === currentNamespace
        const nameAttr: Cell = {
          key: 'NAME',
          value: ns,
          outerCSS: 'entity-name-group',
          css: 'entity-name',
          onclick: `summarize namespace ${ns}`
        }

        const newRow: Row = {
          key: 'CURRENT',
          css: 'selected-entity',
          name: isSelected ? '*' : '',
          fontawesome: 'fas fa-check',
          attributes: [nameAttr].concat(row.attributes),
          rowCSS: isSelected ? 'selected-row' : ''
        }

        newRow.onclick = () => {
          newRow.setSelected()
          args.REPL.pexec(`namespace switch ns ${ns}`)
        }

        return newRow
      })
    })

    // place default at the bottom of the table
    const rowIdxForDefaultNS = baseTable.body.findIndex(_ => _.name === 'default')
    if (rowIdxForDefaultNS >= 0 && baseTable.body.length > 1) {
      const lastRow = augmentedTable.body[augmentedTable.body.length - 1]
      augmentedTable.body[augmentedTable.body.length - 1] = augmentedTable.body[rowIdxForDefaultNS]
      augmentedTable.body[rowIdxForDefaultNS] = lastRow
    }

    return augmentedTable
  } else {
    return baseTable
  }
}

/**
 * Small wrapper to determine whether to use our special namespace
 * table, or the default get impl.
 *
 */
function doGetNamespace(args: Arguments<KubeOptions>) {
  if (isTableRequest(args) && !isWatchRequest(args) && args.execOptions.type === ExecType.TopLevel) {
    return doGetNamespaceTable(args)
  } else {
    return doGet('kubectl')(args)
  }
}

/**
 * Summarize the resources in the namespace indicated by the last
 * positional argument into a table, where resources are histogrammed
 * by kind.
 *
 */
async function doSummarizeNamespace(args: Arguments<KubeOptions>): Promise<true | Table> {
  // summarize this namespace
  const ns = args.argvNoOptions[args.argvNoOptions.length - 1]

  // otherwise, summarize resource count by kind in a table
  const response = await args.REPL.qexec<Table>(`kubectl get all -n ${ns} -o custom-columns=KIND:.kind`)

  if (!isTable(response)) {
    return true
  }

  const resources = response.body
  const histogram = resources.reduce((M, { name: kind }) => {
    M[kind] = (M[kind] || 0) + 1
    return M
  }, {} as Record<string, number>)

  const header = {
    name: 'KIND',
    attributes: [{ key: 'COUNT', value: 'COUNT' }]
  }

  const body = Object.keys(histogram).map(kind => ({
    name: kind,
    onclick: `kubectl get ${kind} -n ${ns}`,
    attributes: [
      {
        key: 'COUNT',
        value: histogram[kind].toLocaleString()
      }
    ]
  }))

  return {
    header,
    body
  }
}

/**
 * Switch to the namespace indicated by the last positional argument,
 * then summarize the resources in that namespace in a table.
 *
 */
async function doSwitchNamespace(args: Arguments<KubeOptions>): Promise<true | Table> {
  // switch to this namespace
  const ns = args.argvNoOptions[args.argvNoOptions.length - 1]

  // this does the actual switch
  await args.REPL.qexec(`kubectl config set-context --current --namespace=${ns}`)

  if (!summarizeNamespaceOnSwitch) {
    // client config told us not to summarize namespace on switch
    return
  }

  return doSummarizeNamespace(args)
}

/**
 * @return the currently active namespace in the currently selected context
 *
 */
async function doGetCurrentNamespace({ tab }: Arguments<KubeOptions>) {
  return (await getCurrentContext(tab)).metadata.namespace
}

export default (commandTree: Registrar) => {
  commandTree.listen(`/${commandPrefix}/kubectl/get/namespaces`, doGetNamespace, flags)
  commandTree.listen(`/${commandPrefix}/k/get/namespaces`, doGetNamespace, flags)
  commandTree.listen(`/${commandPrefix}/kubectl/get/namespace`, doGetNamespace, flags)
  commandTree.listen(`/${commandPrefix}/k/get/namespace`, doGetNamespace, flags)
  commandTree.listen(`/${commandPrefix}/kubectl/get/ns`, doGetNamespace, flags)
  commandTree.listen(`/${commandPrefix}/k/get/ns`, doGetNamespace, flags)

  commandTree.listen(`/${commandPrefix}/namespace/current`, doGetCurrentNamespace, flags)
  commandTree.listen(`/${commandPrefix}/namespace/summarize`, doSummarizeNamespace, flags)
  commandTree.listen(`/${commandPrefix}/namespace/switch`, doSwitchNamespace, flags)
  commandTree.listen(`/${commandPrefix}/ns/switch`, doSwitchNamespace, flags)
}
