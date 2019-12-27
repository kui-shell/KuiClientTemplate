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
 * JSON log records, e.g. from the operator sdk
 *
 * {"level":"info","ts":1572530319.5508614,"logger":"ktest","msg":"mutate is called"}
 *
 */

import { i18n } from '@kui-shell/core'
import { LogEntry, LogLevel } from '../models/entry'

const strings = i18n('plugin-kubeui')

export default {
  entry: (line: string): LogEntry => {
    try {
      const record = JSON.parse(line)

      const base = {
        level: record.level.toUpperCase() as LogLevel,
        timestamp: new Date(1000 * parseFloat(record.ts)).toLocaleString(),
        detail1: record.logger,
        detail1Key: strings('Logger'),
        message: record.msg
      }

      const rest = Object.assign({}, record)
      delete rest.level
      delete rest.logger
      delete rest.msg
      delete rest.ts
      if (Object.keys(rest).length > 0) {
        return Object.assign(base, {
          messageDetail: rest
        })
      } else {
        return base
      }
    } catch (err) {
      console.error('error parsing json', line, err)
      return undefined
    }
  }
}
