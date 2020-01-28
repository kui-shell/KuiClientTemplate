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

import { i18n, Tab, MultiModalResponse, Table, Cell } from '@kui-shell/core'
import { KubeResource, InvolvedObject, TrafficLight } from '@kui-shell/plugin-kubeui'

import { LogEntry } from '../models/entry'
import { LogEntryResource, resourceFromLogEntry } from '../models/resource'

// here are the known log parsers
import json from '../formats/json'
import nginx from '../formats/nginx'
import express from '../formats/express'
import webrick from '../formats/webrick'
import zapr from '../formats/zapr'
import plain from '../formats/plain'

const strings = i18n('plugin-logui')

/** log parsers that can be defined by a RegExp */
interface PatternLogParser {
  pattern: RegExp
  nColumns: number
  entry(match: string[]): LogEntry
}

/** log parsers that cannot easily be defined by a RegExp */
interface LineByLineLogParser {
  entry(line: string): LogEntry
}

type LogParser = PatternLogParser | LineByLineLogParser

/** distinguishes between PatternLogParser and LineByLineLogParser */
function isPatternLogParser(parser: LogParser): parser is PatternLogParser {
  return (parser as PatternLogParser).pattern !== undefined
}

const formats = [nginx, express, webrick, zapr, json, plain]

/**
 * Attempt to parse the given `raw` log string using the given
 * `LogParser`
 *
 */
const tryParse = (raw: string) => (fmt: LogParser): LogEntry[] => {
  if (isPatternLogParser(fmt)) {
    const logLines = raw.trim().split(fmt.pattern)
    const nLines = logLines.length / fmt.nColumns

    if (nLines >= 1) {
      const entries: LogEntry[] = []
      for (let idx = 0; idx < nLines; idx++) {
        const slice = logLines.slice(idx * fmt.nColumns, (idx + 1) * fmt.nColumns)
        if (slice.length === fmt.nColumns) {
          entries.push(fmt.entry(slice))
        }
      }
      return entries.filter(_ => _)
    }
  } else {
    return raw
      .split(plain.pattern)
      .map(fmt.entry)
      .filter(_ => _)
  }
}

/**
 * Turn entry.level into HTML
 *
 */
function formatLevel(entry: LogEntry): string {
  if (entry.level === 'ERROR') {
    return TrafficLight.Red
  } else if (entry.level === 'WARN') {
    return TrafficLight.Yellow
  } else if (entry.level === 'INFO') {
  } else {
  }
}

/**
 * onclick
 *
 */
async function showLogEntry(
  logLine: LogEntry,
  involvedObject: InvolvedObject
): Promise<MultiModalResponse<LogEntryResource>> {
  const modes = []

  return Object.assign(await resourceFromLogEntry(logLine, involvedObject), {
    toolbarText: {
      type: 'info',
      text: strings('Occurred at', logLine.timestamp)
    },
    modes
  })
}

/**
 *
 *
 */
export async function formatAsTable(raw: string, metadata: { name: string; namespace?: string }): Promise<Table> {
  if (raw.length === 0) {
    return {
      body: []
    }
  }

  const { name, namespace = 'default' } = metadata
  const kindMatch = name.match(/(\w+)\//)
  const kindOfInvolved = kindMatch ? kindMatch[1] : 'pod'
  const apiVersionOfInvolved = /^deploy/i.test(kindOfInvolved)
    ? 'extensions/v1beta1'
    : /^job/i.test(kindOfInvolved)
    ? 'batch/v1'
    : 'v1'

  const involvedObject = {
    apiVersion: apiVersionOfInvolved,
    kind: kindOfInvolved,
    name,
    namespace
  }

  const logLines = formats.map(tryParse(raw)).filter(_ => _ && _.length > 0)[0]
  const anyStructure = !!logLines.find(_ => _.timestamp)

  // headers
  const level = [{ value: strings('Level') }]

  const aDetail1 = logLines.find(_ => _.detail1)
  const detail1 = aDetail1 ? [{ value: aDetail1.detail1Key || strings('Details') }] : []

  const aDetail2 = logLines.find(_ => _.detail2)
  const detail2 = aDetail2 ? [{ value: aDetail2.detail2Key || strings('More Details') }] : []

  const message = [{ value: strings('Message'), css: 'hide-with-sidecar' }]

  const header = !anyStructure
    ? {
        name: strings('Message'),
        attributes: level.concat(detail1).concat(detail2)
      }
    : {
        name: strings('Timestamp'),
        attributes: level
          .concat(detail1)
          .concat(detail2)
          .concat(message)
      }

  return {
    header,
    noSort: true,
    body: await Promise.all(
      logLines.map(async logLine => {
        const attributes: Cell[] = []

        attributes.push({
          tag: 'badge',
          value: logLine.level,
          css: formatLevel(logLine)
        })

        if (logLine.detail1) {
          attributes.push({ value: logLine.detail1 })
        }

        if (logLine.detail2) {
          attributes.push({ value: logLine.detail2 })
        }

        if (logLine.timestamp) {
          attributes.push({
            value: logLine.message,
            css: 'somewhat-smaller-text pre-wrap slightly-deemphasize hide-with-sidecar'
          })
        }

        /* if (logLine.messageDetail) {
        const value =
          Object.keys(logLine.messageDetail).length === 0 ? '' : JSON.stringify(logLine.messageDetail, undefined, 2)
        attributes.push({ value: value, css: 'smaller-text pre-wrap break-all sub-text' })
      } */

        return {
          name: logLine.timestamp || logLine.message,
          outerCSS: 'not-a-name',
          onclick:
            (logLine.messageDetail || logLine.detail1 || logLine.detail2) &&
            (await showLogEntry(logLine, { involvedObject })),
          tag: 'div',
          attributes
        }
      })
    )
  }
}

/**
 * Takes an already-fetched kube log resource and returns a table of
 * its raw log data
 *
 */
export default function renderLogs(tab: Tab, resource: KubeResource): Promise<Table> {
  return formatAsTable(resource.data, resource.metadata)
}
