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

import * as bytes from 'bytes-iec'

export function fromTime(str: string): number {
  if (/m$/.test(str)) {
    return parseInt(str.replace(/m$/, ''), 10)
  } else {
    return parseInt(str, 10) * 1000
  }
}

export function fromSize(str: string): number {
  return bytes(
    str
      .replace(/m/g, 'MB')
      .replace(/Ki/g, 'KiB')
      .replace(/Mi/g, 'MiB')
      .replace(/Gi/g, 'GiB')
      .replace(/Ti/g, 'TiB')
  )
}

export default function parseAsSize(str: string): string {
  return bytes(fromSize(str), {})
}
