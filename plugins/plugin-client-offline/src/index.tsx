/*
 * Copyright 2020 The Kubernetes Authors
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

import React from 'react'

import { Kui, KuiProps, ContextWidgets, Icons, MadeWithKui, MeterWidgets, SpaceFiller } from '@kui-shell/plugin-client-common'

import { homepage, version } from '@kui-shell/client/package.json'
import { productName } from '@kui-shell/client/config.d/name.json'

function GithubIcon() {
  return (
    <a
      target="#"
      title="Visit our Github Page"
      href={homepage}
      className="kui--status-stripe-element-clickable kui--status-stripe-element"
    >
      <Icons icon="Github" className="somewhat-larger-text" />
    </a>
  )
}

/**
 * Offline client definition
 */
export default function renderMain(props: KuiProps) {
  return (
    <Kui
      noHelp
      version={version}
      productName={productName}
      lightweightTables
      {...props}
      >
      <ContextWidgets>
        <GithubIcon />
      </ContextWidgets>

      <SpaceFiller />

      <MeterWidgets>
        <MadeWithKui />
      </MeterWidgets>
    </Kui>
  )
}
