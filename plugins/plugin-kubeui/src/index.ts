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

// this file defines the external API

export {
  KubeResource,
  isKubeResource,
  isCrudableKubeResource,
  KubeResourceWithSummary,
  WithSummary,
  WithRawData,
  InvolvedObject,
  KubeStatus,
  Pod,
  isPod,
  Deployment,
  isDeployment,
  Job,
  isJob,
  Resource
} from './lib/model/resource'

export { default as apiVersion } from './controller/kubectl/apiVersion'

export { doExecWithPty, doExecWithStdout, doExecWithStatus, doExecWithTable } from './controller/kubectl/exec'

export { doExecRaw, doNativeExec } from './controller/kubectl/raw'

export { default as defaultFlags } from './controller/kubectl/flags'

export { KubeOptions, getNamespace, getNamespaceForArgv } from './controller/kubectl/options'

export { default as parseName } from './lib/util/name'

export { formatTable, preprocessTable } from './lib/view/formatTable'

export { renderHelp } from './lib/util/help'

export { fetchFileString } from './lib/util/fetch-file'
