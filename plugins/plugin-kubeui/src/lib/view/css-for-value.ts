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

/**
 * Decorate certain values specially
 *
 */
export default {
  // helm lifecycle
  UNKNOWN: '',
  DEPLOYED: 'green-background',
  DELETED: '',
  SUPERSEDED: 'yellow-background',
  FAILED: 'red-background',
  DELETING: 'yellow-background',

  // pod lifecycle
  'Init:0/1': 'yellow-background',
  PodScheduled: 'yellow-background',
  PodInitializing: 'yellow-background',
  Initialized: 'yellow-background',
  Terminating: 'yellow-background',

  // kube lifecycle
  CrashLoopBackOff: 'red-background',
  Failed: 'red-background',
  Running: 'green-background',
  Pending: 'yellow-background',
  Succeeded: 'gray-background', // successfully terminated; don't use a color
  Completed: 'gray-background', // successfully terminated; don't use a color
  Unknown: '',

  // AWS events
  Ready: 'green-background',
  ProvisionedSuccessfully: 'green-background',

  // kube events
  Active: 'green-background',
  Online: 'green-background',
  NodeReady: 'green-background',
  Pulled: 'green-background',
  Rebooted: 'green-background',
  Started: 'green-background',
  Created: 'green-background',
  Scheduled: 'green-background',
  SuccessfulCreate: 'green-background',
  SuccessfulMountVol: 'green-background',
  ContainerCreating: 'yellow-background',
  Starting: 'yellow-background',
  NodeNotReady: 'yellow-background',
  Killing: 'yellow-background',
  Deleting: 'yellow-background',
  Pulling: 'yellow-background',
  BackOff: 'yellow-background',
  Unhealthy: 'red-background',
  FailedScheduling: 'red-background',
  FailedKillPod: 'red-background'
}
