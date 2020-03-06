/*
 * Copyright 2018 IBM Corporation
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

/* eslint-disable @typescript-eslint/no-unused-vars */
import * as Debug from 'debug' // DEBUG
import { Arguments, NavResponse, Table, isNavResponse } from '@kui-shell/core'
import { KubeOptions, isHelpRequest } from '../../controller/kubectl/options'
import commandPrefix from '../../controller/command-prefix'
import { doExecWithoutPty, Prepare, NoPrepare } from '../../controller/kubectl/exec'

const debug = Debug('kubectl/help')

/**
 * Some of the kubectl doc strings try to be polite have form
 * sentences with a trailing period. In a visual form, as long as it
 * is a single sentence, this is less necessary.
 *
 */
const removeSolitaryAndTrailingPeriod = (str: string) => str.replace(/^\s*([^.]+)[.]\s*$/, '$1').trim()

/**
 * Pretty-print the kubectl help output
 *
 * @param command e.g. helm versus kubectl
 * @param verb e.g. list versus get
 *
 */
export const renderHelp = (out: string, command: string, verb: string, exitCode: number): NavResponse => {
  // kube and helm help often have a `Use "this command" to do that operation`
  // let's pick those off and place them into the detailedExample model
  const splitOutUse = out.match(/((Use[^\n]+\n)+)$/)
  const nonUseOut = !splitOutUse ? out : out.substring(0, splitOutUse.index) // having stripped off the Use parts
  const usePart = splitOutUse && splitOutUse[1] // the Use parts, if any

  const rawSections = nonUseOut.split(/\n([^'\s].*:)\n/) // the non-use sections of the docs
  const header = rawSections[0] // the first section is the top-level doc string

  // for the remaining sections, form a [{ title, content }] model
  const _allSections: Section[] = rawSections.slice(1).reduce((S, _, idx, sections) => {
    if (idx % 2 === 0) {
      S.push({
        title: sections[idx],
        content: sections[idx + 1].replace(/^\n/, '')
      })
    }

    return S
  }, [])

  interface Section {
    title: string
    content: string
  }
  const allSections: Section[] = [_allSections[0]].concat(
    _allSections.slice(1).sort((a, b) => -a.title.localeCompare(b.title))
  )

  // sometimes, the first section is extra intro docs; sometimes it
  // is a legitimate command/usage section
  // const firstSectionIsCommandLike = /command/i.test(allSections[0].title) && !/to begin/i.test(allSections[0].title)
  const intro = undefined // !firstSectionIsCommandLike && allSections[0]

  // pull off the Usage section and place it into our usage model
  const usageSection = allSections.filter(({ title }) => title === 'Usage:')

  // pull off the Examples section
  const examplesSection = allSections.find(({ title }) => title === 'Examples:')

  const remainingSections = allSections
    // .slice(firstSectionIsCommandLike ? 0 : 1)
    .filter(({ title }) => title !== 'Usage:' && title !== 'Examples:')

  const sections = remainingSections.map(({ title, content }) => {
    return {
      title,
      nRowsInViewport: title.match(/Available Commands/i) ? 8 : undefined,
      rows: content
        .split(/[\n\r]/)
        .filter(x => x)
        .map(line => line.split(/(\t|(\s\s)+\s?)|(?=:\s)/).filter(x => x && !/(\t|\s\s)/.test(x)))
        .map(([thisCommand, docs]) => {
          if (thisCommand) {
            return {
              command: thisCommand.replace(/^\s*-\s+/, '').replace(/:\s*$/, ''),
              docs: docs && docs.replace(/^\s*:\s*/, ''),
              commandPrefix: /Commands/i.test(title) && `${command} ${verb || ''}`,
              noclick: !title.match(/Common actions/i) && !title.match(/Commands/i)
            }
          }
        })
        .filter(x => x)
    }
  })

  const detailedExample = (examplesSection ? examplesSection.content : '')
    .split(/^\s*(?:#\s+)/gm)
    .map(x => x.trim())
    .filter(x => x)
    .map(group => {
      //
      // Explanation: compare `kubectl completion -h` to `kubectl get -h`
      // The former Examples section has a structure of (Summary, MultiLineDetail)
      // while the latter is shaped like (DescriptionLine, CommandLine).
      //
      // The lack of symmetry is a bit odd (detail/description
      // is second versus first), but understandable, given
      // that the former's Detail takes up multiple lines
      // whereas the latter has a pair of lines. Let's
      // introduce some symmetry here.
      //
      const match = group.match(/(.*)[\n\r]([\s\S]+)/)
      if (match && match.length === 3) {
        const [, firstPartFull, secondPartFull] = match

        const firstPart = removeSolitaryAndTrailingPeriod(firstPartFull)
        const secondPart = removeSolitaryAndTrailingPeriod(secondPartFull)

        const secondPartIsMultiLine = secondPart.split(/[\n\r]/).length > 1

        const command = secondPartIsMultiLine ? firstPart : secondPart
        const docs = secondPartIsMultiLine ? secondPart : firstPart

        return {
          command,
          docs
        }
      } else {
        // see kubectl label -h for an example of a multi-line "firstPart"
        return {
          copyToNextLine: group
        }
      }
    })
    .reduce((lines, lineRecord, idx, A) => {
      for (let jdx = idx - 1; jdx >= 0; jdx--) {
        if (A[jdx].copyToNextLine) {
          lineRecord.docs = `${A[jdx].copyToNextLine}\n${lineRecord.docs}`
        } else {
          break
        }
      }

      if (!lineRecord.copyToNextLine) {
        lines.push(lineRecord)
      }
      return lines
    }, [])
    .filter(x => x)

  /* Here comes Usage NavResponse */

  const commandDocTable = (rows: { command: string; docs: string }[]): Table => ({
    noSort: true,
    noEntityColors: true,
    header: {
      name: 'COMMAND',
      attributes: [{ value: 'DOCS' }]
    },
    body: rows.map(({ command, docs }, idx) => ({
      name: command,
      outerCSS: idx === 0 ? 'semi-bold' : '',
      css: 'lighter-text',
      attributes: [{ key: 'DOCS', value: docs }]
    }))
  })

  const kind = 'NavResponse'
  const metadata = { name: 'usage' }

  /** headerNav contains sections: About and Usage */
  const headerNav = (title: string) => ({
    [title]: {
      kind,
      metadata,
      modes: [
        {
          mode: 'About',
          content: header.concat(usePart),
          contentType: 'text/markdown'
        },
        {
          mode: 'Usage',
          content: usageSection[0].content,
          contentType: 'text/html' // FIXME: text/markdown will turn [] to link, we should wrap the content with markdown code syntax
        }
      ]
    }
  })

  /** commandNav contains sections: Commands */
  const commandNav = () => {
    if (sections.some(section => /command/i.test(section.title))) {
      return {
        Commands: {
          kind,
          metadata,
          modes: sections
            .filter(section => /command/i.test(section.title))
            .map(section => {
              return {
                mode: section.title.replace(/Command(s)/, '').replace(':', ''),
                content: commandDocTable(section.rows)
              }
            })
        }
      }
    }
  }

  const optionNav = () => {
    if (sections.some(section => /Options/i.test(section.title))) {
      return {
        Options: {
          kind,
          metadata,
          modes: sections
            .filter(section => /Options/i.test(section.title))
            .map(section => {
              return {
                mode: section.title.replace(':', ''),
                content: commandDocTable(section.rows)
              }
            })
        }
      }
    }
  }

  /** header nav contains sections: Examples */
  const exampleNav = () => {
    if (detailedExample && detailedExample.length > 0) {
      return {
        Examples: {
          kind,
          metadata,
          modes: detailedExample.map(_ => ({
            mode: _.command,
            content: commandDocTable([_])
          }))
        }
      }
    }
  }

  const usageResponse = Object.assign(
    headerNav(verb ? `${command} ${verb}` : command),
    commandNav(),
    optionNav(),
    exampleNav()
  )

  debug('usageResponse', usageResponse)

  return usageResponse
}

/** is the given string `str` the `kubectl` command? */
const isKubectl = (args: Arguments<KubeOptions>) =>
  (args.argvNoOptions.length === 1 && /^k(ubectl)?$/.test(args.argvNoOptions[0])) ||
  (args.argvNoOptions.length === 2 &&
    args.argvNoOptions[0] === commandPrefix &&
    /^k(ubectl)?$/.test(args.argvNoOptions[1]))

export const isUsage = (args: Arguments<KubeOptions>) => isHelpRequest(args) || isKubectl(args)

export async function doHelp<O extends KubeOptions>(
  args: Arguments<O>,
  prepare: Prepare<O> = NoPrepare
): Promise<NavResponse> {
  const response = await doExecWithoutPty(args, prepare)
  const verb = args.argvNoOptions.length >= 2 ? args.argvNoOptions[1] : ''
  return renderHelp(response.content.stdout, 'kubectl', verb, response.content.code)
}
