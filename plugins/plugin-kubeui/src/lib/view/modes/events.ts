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

import { Tab } from '@kui-shell/core/api/ui-lite'
import { BadgeRegistration, ModeRegistration } from '@kui-shell/core/api/registrars'
import { i18n } from '@kui-shell/core/api/i18n'

import cssForValue from '../css-for-value'
import { Event, isEvent, KubeResource, isKubeResource } from '../../model/resource'

const strings = i18n('plugin-kubeui')

/**
 * Extract the events
 *
 */
function command(tab: Tab, resource: KubeResource) {
  const cmdGetPodEvents = `kubectl get events --field-selector involvedObject.name=${resource.metadata.name},involvedObject.namespace=${resource.metadata.namespace} -n ${resource.metadata.namespace}`

  // mimic the events table shown in the 'kubectl describe' output
  const customColumns = 'wide'
  // 'custom-columns=TYPE:type,REASON:reason,LAST SEEN:lastTimestamp,COUNT:count,FIRST SEEN:firstTimestamp,FROM:source.component,MESSAGE:message'

  return `${cmdGetPodEvents} -o "${customColumns}"`
}

/**
 * @return whether the given resource might possibly have events;
 * since Events never have Events, we can exclude those always
 *
 */
function hasEvents(resource: KubeResource): boolean {
  return isKubeResource(resource) && !isEvent(resource)
}

/**
 * Add a Events mode button to the given modes model, if called for by
 * the given resource.
 *
 */
export const eventsMode: ModeRegistration<KubeResource> = {
  when: hasEvents,
  mode: {
    mode: 'events',
    label: strings('Show Events'),
    command,
    kind: 'drilldown'
  }
}

export const eventsBadge: BadgeRegistration<Event> = {
  when: isEvent,
  badge: (event: Event) => {
    const cssFromReason = cssForValue[event.reason]
    return {
      title: cssFromReason ? event.reason : event.type,
      css:
        cssFromReason ||
        (event.type === 'Error' ? 'red-background' : event.type === 'Warning' ? 'yellow-background' : undefined)
    }
  }
}
