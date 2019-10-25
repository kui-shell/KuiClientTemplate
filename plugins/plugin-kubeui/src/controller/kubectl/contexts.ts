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

import Commands from '@kui-shell/core/api/commands'
import { i18n } from '@kui-shell/core/api/i18n'
import Errors from '@kui-shell/core/api/errors'
import { Table, MultiTable, Row, isMultiTable } from '@kui-shell/core/api/table-models'

import flags from './flags'
import { doExecWithTable } from './exec'
import commandPrefix from '../command-prefix'

const strings = i18n('plugin-kubeui')

const usage = {
  context: (command: string): Errors.UsageModel => ({
    command,
    strict: command,
    docs: 'Print your current kubernetes context',
    example: 'kubectl context'
  }),
  contexts: (command: string): Errors.UsageModel => ({
    command,
    strict: command,
    docs: 'List your available kubernetes contexts',
    example: 'kubectl contexts'
  })
}

/**
 * Add click handlers to change context
 *
 */
const addClickHandlers = (
  table: Table,
  { REPL }: Commands.Arguments,
  execOptions: Commands.ExecOptions
): Table => {
  const body: Row[] = table.body.map(
    (row): Row => {
      const nameAttr = row.attributes.find(({ key }) => key === 'NAME')
      const { value: contextName } = nameAttr

      nameAttr.outerCSS += ' entity-name-group-narrow'

      const onclick = async () => {
        await REPL.qexec(
          `kubectl config use-context ${REPL.encodeComponent(contextName)}`,
          undefined,
          undefined,
          Object.assign({}, execOptions, { raw: true })
        )
        row.setSelected()
      }

      row.name = contextName
      row.onclick = onclick
      nameAttr.onclick = onclick

      return row
    }
  )

  return new Table({
    header: table.header,
    body: body,
    title: strings('contextsTableTitle')
  })
}

/**
 * List contets command handler
 *
 */
const listContexts = (args: Commands.Arguments): Promise<Table | MultiTable> => {
  const execOptions = Object.assign({}, args.execOptions, { render: false })

  return args.REPL.qexec<Table | MultiTable>(
    `kubectl config get-contexts`,
    undefined,
    undefined,
    execOptions
  ).then((contexts: Table | MultiTable) =>
    isMultiTable(contexts)
      ? { tables: contexts.tables.map(context => addClickHandlers(context, args, execOptions)) }
      : addClickHandlers(contexts, args, execOptions)
  )
}

/**
 * Register the commands
 *
 */
export default (commandTree: Commands.Registrar) => {
  commandTree.listen(`/${commandPrefix}/kubectl/config/get-contexts`, doExecWithTable)

  commandTree.listen(
    `/${commandPrefix}/context`,
    async ({ execOptions, REPL }) => {
      return (await REPL.qexec<string>(
        `kubectl config current-context`,
        undefined,
        undefined,
        Object.assign({}, execOptions, { raw: true })
      )).trim()
    },
    {
      usage: usage.context('context'),
      inBrowserOk: true
    }
  )

  commandTree.listen(`/${commandPrefix}/contexts`, listContexts, Object.assign({
    usage: usage.contexts('contexts'),
  }, flags))
}
