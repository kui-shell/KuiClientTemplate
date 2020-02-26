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

import * as React from 'react'

import { DefaultClient } from '@kui-shell/plugin-client-default/mdist/Client'
import { ContextWidgets, MeterWidgets } from '@kui-shell/plugin-client-common'

import { default as CurrentNamespace } from './view/status-stripe/current-namespace'
import { default as CurrentContext } from './view/status-stripe/current-context'
import { default as ClusterUtilization } from './view/status-stripe/cluster-utilization'

/**
 * Format our body, with extra status stripe widgets
 *   - CurrentGitBranch
 *
 */
export default function renderMain() {
  return (
    <DefaultClient>
      <ContextWidgets>
        <CurrentContext />
        <CurrentNamespace />
      </ContextWidgets>
      <MeterWidgets>
        <ClusterUtilization />
      </MeterWidgets>
    </DefaultClient>
  )
}
