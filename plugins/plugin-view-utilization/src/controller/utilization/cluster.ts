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

import { Arguments, Table } from '@kui-shell/core'

import getPodData from '../get-pod-data'
import getNodeData from '../get-node-data'
import { sumTime, sumSize } from '../../lib/parse'
import { BarColor, singletonBar as bar } from '../../view/bar'
import { cpuPretty, memPretty, calcPercentage } from '../../lib/format'

/**
 * @return the Schedulable metric
 *
 */
function calcSched(requests: number, allocatable: number): number {
  if (allocatable >= requests) {
    return allocatable - requests
  } else {
    return 0
  }
}

/**
 * @return the free ratio
 *
 */
function calcFree(requests: number, limits: number, allocatable: number): number {
  const totalUsed = limits > requests ? limits : requests
  if (allocatable > totalUsed) {
    return allocatable - totalUsed
  } else {
    return 0
  }
}

/** column headers */
const headerNames = {
  req: 'REQUESTS',
  percentReq: '%REQUESTS',
  lim: 'LIMITS',
  percentLim: '%LIMITS',
  alloc: 'ALLOCATABLE',
  sched: 'SCHEDULABLE',
  free: 'FREE'
}

/** used in the cluster-utilization widget */
export const percentLimHeader = headerNames.percentLim

/**
 * Formatter for `utilization cluster`
 *
 */
function formatClusterUtilization(nodes: Table, pods: Table): Table {
  const allocCpu = sumTime(nodes, 0)
  const allocMem = sumSize(nodes, 1)
  const reqCpu = sumTime(pods, 3)
  const reqMem = sumSize(pods, 4)
  const limCpu = sumTime(pods, 5)
  const limMem = sumSize(pods, 6)

  const reqCpuText = cpuPretty(reqCpu)
  const reqMemText = memPretty(reqMem)
  // const req_width=calc_max_width(reqHeader, reqCpuText, reqMemText)

  const percentReqCpuText = calcPercentage(reqCpu, allocCpu)
  const percentReqMemText = calcPercentage(reqMem, allocMem)
  // const percentReq_width=calc_max_width(percentReqHeader, percentReqCpuText, percentReqMemText)

  const limCpuText = cpuPretty(limCpu)
  const limMemText = memPretty(limMem)
  // const lim_width=calc_max_width(limHeader, limCpuText, limMemText)

  const percentLimCpuText = calcPercentage(limCpu, allocCpu)
  const percentLimMemText = calcPercentage(limMem, allocMem)
  // const percentLim_width=calc_max_width(percentLimHeader, percentLimCpuText, percentLimMemText)

  const allocCpuText = cpuPretty(allocCpu)
  const allocMemText = memPretty(allocMem)
  // const alloc_width=calc_max_width(allocHeader, allocCpuText, allocMemText)

  const schedCpuText = cpuPretty(calcSched(reqCpu, allocCpu))
  const schedMemText = memPretty(calcSched(reqMem, allocMem))
  // const sched_width=calc_max_width(schedHeader, schedCpuText, schedMemText)

  const freeCpuText = cpuPretty(calcFree(reqCpu, limCpu, allocCpu))
  const freeMemText = memPretty(calcFree(reqMem, limMem, allocMem))
  // const free_width=calc_max_width("Free", freeCpuText, freeMemText)

  const cpuRow = {
    name: 'CPU',
    attributes: [
      { value: reqCpuText, outerCSS: 'hide-with-sidecar' },
      { value: percentReqCpuText },
      { value: limCpuText, outerCSS: 'hide-with-sidecar' },
      { value: percentLimCpuText, valueDom: bar(BarColor.CPU, percentLimCpuText) },
      { value: allocCpuText },
      { value: schedCpuText },
      { value: freeCpuText }
    ]
  }
  const memRow = {
    name: 'Memory',
    attributes: [
      { value: reqMemText, outerCSS: 'hide-with-sidecar' },
      { value: percentReqMemText },
      { value: limMemText, outerCSS: 'hide-with-sidecar' },
      { value: percentLimMemText, valueDom: bar(BarColor.Memory, percentLimMemText) },
      { value: allocMemText },
      { value: schedMemText },
      { value: freeMemText }
    ]
  }
  return {
    header: {
      name: 'Resource',
      attributes: [
        { key: headerNames.req, value: headerNames.req, outerCSS: 'hide-with-sidecar' },
        { key: headerNames.percentReq, value: headerNames.percentReq },
        { key: headerNames.lim, value: headerNames.lim, outerCSS: 'hide-with-sidecar' },
        { key: headerNames.percentLim, value: headerNames.percentLim },
        { key: headerNames.alloc, value: headerNames.alloc },
        { key: headerNames.sched, value: headerNames.sched },
        { key: headerNames.free, value: headerNames.free }
      ]
    },
    body: [cpuRow, memRow]
  }
}

/**
 * Command handler for `utilization cluster`
 *
 */
export default async function clusterUtilization(args: Arguments): Promise<Table> {
  const [nodes, pods] = await Promise.all([getNodeData(args, true), getPodData(args, true)])

  return formatClusterUtilization(nodes, pods)
}
