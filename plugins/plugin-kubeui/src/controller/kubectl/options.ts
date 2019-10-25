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

import Commands from '@kui-shell/core/api/commands'

type EntityFormat = 'yaml' | 'json'
type TableFormat = 'wide' | string // want: 'custom-columns-file=' | 'custom-columns='
type CustomFormat = string // want: 'go-template' | 'go-template-file' | 'jsonpath' | 'jsonpath-file'
type OutputFormat = EntityFormat | TableFormat | CustomFormat

export function formatOf(args: Commands.Arguments<KubeOptions>): OutputFormat {
  return args.parsedOptions.o || args.parsedOptions.output
}

export function isEntityFormat(format: OutputFormat): format is EntityFormat {
  return format === 'yaml' || format === 'json'
}

export function isEntityRequest(args: Commands.Arguments<KubeOptions>) {
  return isEntityFormat(formatOf(args))
}

/**
 * Notes: we interpret the lack of an output format designation as a
 * request for tabular output. This seems in keeping with the
 * `kubectl` behavior.
 *
 * @return truthy if the format indicates a desire for tabular output
 *
 */
function isTableFormat(format: OutputFormat): format is TableFormat {
  return !format || format === 'wide' || /^custom-columns=/.test(format) || /^custom-columns-file=/.test(format)
}

export function isTableRequest(args: Commands.Arguments<KubeOptions>) {
  return isTableFormat(formatOf(args))
}

export function isWatchRequest(args: Commands.Arguments<KubeOptions>) {
  return args.parsedOptions.w || args.parsedOptions.watch || args.parsedOptions['watch-only']
}

export function isTableWatchRequest(args: Commands.Arguments<KubeOptions>) {
  return isWatchRequest(args) && isTableRequest(args)
}

export interface KubeOptions extends Commands.ParsedOptions {
  n: string
  namespace: string

  o: OutputFormat
  output: OutputFormat

  w: boolean
  watch: boolean
  'watch-only': boolean

  wait: boolean
}

export default KubeOptions
