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

/**
 * nginx-style log records
 *
 * 10.73.230.207 - - [04/Nov/2019:14:19:31 +0000] "GET / HTTP/1.1" 200 396 "-" "kube-probe/1.15"
 *
 */

import { LogEntry } from '../models/entry'

export default {
  pattern: /^(\d+.\d+.\d+.\d+) - (\w*)- \[(\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2} [+-]\d{4})\] "(\w+) (\S+) (\S+)" (\d+) (\d+) "(\S+)" "(.+)"$/m,
  nColumns: 11,
  entry: (match: string[]): LogEntry => {
    return {
      level: parseInt(match[7], 10) < 400 ? 'INFO' : 'ERROR',
      timestamp: match[3],
      detail1: match[7],
      detail1Key: 'status',
      detail2: match[4],
      detail2Key: 'method',
      message: [match[1], match[2], match[6], match[8], match[9], match[10]].join(' ')
    }
  }
}
