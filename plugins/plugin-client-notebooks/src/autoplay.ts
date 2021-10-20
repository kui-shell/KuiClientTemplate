/*
 * Copyright 2021 The Kubernetes Authors
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
 * @return if found, the autoplay.json config, which will be a list of
 * notebooks to play on load.
 *
 */
export default function autoplay(): string[] {
  try {
    const autoplay = require('@kui-shell/client/config.d/autoplay.json')
    if (!Array.isArray(autoplay)) {
      console.error('autoplay config is not an array')
      return []
    } else if (autoplay.length > 0 && typeof autoplay[0] !== 'string') {
      console.error('autoplay config is not an array')
      return []
    } else {
      return autoplay
    }
  } catch (err) {
    // no autoplay...
    return []
  }
}
