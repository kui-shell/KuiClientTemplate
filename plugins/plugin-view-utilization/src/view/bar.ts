/*
 * Copyright 2019-2020 IBM Corporation
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

export const enum BarColor {
  CPU = 'var(--color-latency-0)',
  Memory = 'var(--color-latency-1)',
  Overcommitted = 'var(--color-error)'
}

/**
 * |    >   |
 *
 * where, in the code below:
 * - `bar` is |        |
 * - `live` is the region of `bar` up to the >
 */
function makeBar(color: BarColor, container: Element): HTMLElement {
  const bar = document.createElement('div')
  const live = document.createElement('div')

  bar.style.display = 'flex'
  bar.style.background = 'var(--color-stripe-01)'
  live.style.background = color
  bar.style.height = '45%'
  live.style.borderRight = '1px solid var(--color-stripe-02)'

  bar.appendChild(live)
  container.appendChild(bar)
  return live
}

/**
 * Create a bar, and place it in the given container. If the optional
 * initialFraction is given, then set the bar's width to that value.
 *
 */
export function bar(container: Element, color: BarColor, initialFraction?: string): HTMLElement {
  const dom = makeBar(color, container)

  if (initialFraction) {
    dom.style.width = initialFraction
  }

  return dom
}

/**
 * Create a container for one or more bars.
 *
 * @param alignment for singleton bars, probably 'center'; for
 * multi-bar content, probably 'space-between'
 *
 * @return the container DOM
 *
 */
export function barContainer(alignment: 'space-between' | 'center' = 'space-between'): HTMLElement {
  const container = document.createElement('div')

  container.style.display = 'flex'
  container.style.flexDirection = 'column'
  container.style.justifyContent = alignment
  container.style.width = '5em'
  container.style.height = '1.375em'

  return container
}

/**
 * Create a single bar with its own container, and return the container.
 *
 */
export function singletonBar(color: BarColor, initialFraction?: string): HTMLElement {
  const container = barContainer('center')
  bar(container, color, initialFraction)
  return container
}
