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

import { i18n, Table, Arguments, ExecOptions, Registrar, UsageModel } from '@kui-shell/core'

import flags from './flags'
import commandPrefix from '../command-prefix'
import { doExecWithTable } from './exec'

const strings = i18n('plugin-kubeui')

const usage = {
  context: (command: string): UsageModel => ({
    command,
    strict: command,
    docs: 'Print your current kubernetes context',
    example: 'kubectl context'
  }),
  contexts: (command: string): UsageModel => ({
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
const addClickHandlers = (table: Table, { REPL }: Arguments, execOptions: ExecOptions): Table => {
  const body = table.body.map(row => {
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
  })

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
const listContexts = (args: Arguments): Promise<Table> => {
  const execOptions = Object.assign({}, args.execOptions, { render: false })

  return args.REPL.qexec<Table>(`kubectl config get-contexts`, undefined, undefined, execOptions).then(contexts =>
    addClickHandlers(contexts, args, execOptions)
  )
}

/**
 * Register the commands
 *
 */
export default (commandTree: Registrar) => {
  commandTree.listen(`/${commandPrefix}/kubectl/config/get-contexts`, doExecWithTable, flags)

  commandTree.listen(
    `/${commandPrefix}/context`,
    async ({ REPL }) => {
      return (await REPL.qexec<string>('kubectl config current-context', undefined, undefined, { raw: true })).trim()
    },
    Object.assign(
      {
        usage: usage.context('context')
      },
      flags
    )
  )

  commandTree.listen(
    `/${commandPrefix}/contexts`,
    listContexts,
    Object.assign(
      {
        usage: usage.contexts('contexts')
      },
      flags
    )
  )
}
