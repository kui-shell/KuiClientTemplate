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
 * express-style log records
 *
 * Fri, 22 Nov 2019 18:33:42 GMT express:router:layer new '/'
 *
 * 2019-11-22T18:33:43.062Z kui-proxy/webapp Listening on port 3000
 *
 */

import { LogEntry } from '../models/entry'

export default {
  pattern: /^(\w{3},\s+\d{2}\s+\w{3}\s+\d{4}\s+\d{2}:\d{2}:\d{2}\s+\w{3}|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z)\s+(\S+)\s+(.+)$/m,
  nColumns: 4,
  entry: (match: string[]): LogEntry => {
    return {
      level: 'INFO',
      timestamp: match[1],
      detail1: match[2],
      detail1Key: 'status',
      message: match[3]
    }
  }
}
