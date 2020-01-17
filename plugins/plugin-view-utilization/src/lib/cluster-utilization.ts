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

import * as bytes from 'bytes-iec'
import { Arguments, Table } from '@kui-shell/core'

import getPodData from './get-pod-data'
import getNodeData from './get-node-data'
import { fromTime, fromSize } from './parse-as-size'

function sumTime(table: Table, attrIdx: number): number {
  return table.body.reduce((sum, _) => sum + fromTime(_.attributes[attrIdx].value), 0)
}

function sumSize(table: Table, attrIdx: number): number {
  return table.body.reduce((sum, _) => sum + fromSize(_.attributes[attrIdx].value), 0)
}

function calcPercentage(a: number, b: number): string {
  if (a > 0 && b > 0) {
    return ((a * 100) / b).toFixed(2) + '%'
  } else if (b > 0) {
    return '0%'
  } else {
    return 'Err'
  }
}

function cpuPretty(sum: number): string {
  const n = sum / 1000
  if (sum < 10000) {
    return n.toFixed(2)
  } else {
    return n.toFixed(0)
  }
}

function memPretty(sum: number): string {
  return bytes(sum, {})
}

function calcSched(requests: number, allocatable: number): number {
  if (allocatable >= requests) {
    return allocatable - requests
  } else {
    return 0
  }
}

function calcFree(requests: number, limits: number, allocatable: number): number {
  const totalUsed = limits > requests ? limits : requests
  if (allocatable > totalUsed) {
    return allocatable - totalUsed
  } else {
    return 0
  }
}

const reqHeader = 'REQUESTS'
const percentReqHeader = '%REQUESTS'
const limHeader = 'LIMITS'
export const percentLimHeader = '%LIMITS'
const allocHeader = 'ALLOCATABLE'
const schedHeader = 'SCHEDULABLE'
const freeHeader = 'FREE'

/**
 * Formatter for `utilization cluster`
 *
 */
function format(nodes: Table, pods: Table): Table {
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
      { value: percentLimCpuText },
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
      { value: percentLimMemText },
      { value: allocMemText },
      { value: schedMemText },
      { value: freeMemText }
    ]
  }
  return {
    header: {
      name: 'Resource',
      attributes: [
        { key: reqHeader, value: reqHeader, outerCSS: 'hide-with-sidecar' },
        { key: percentReqHeader, value: percentReqHeader },
        { key: limHeader, value: limHeader, outerCSS: 'hide-with-sidecar' },
        { key: percentLimHeader, value: percentLimHeader },
        { key: allocHeader, value: allocHeader },
        { key: schedHeader, value: schedHeader },
        { key: freeHeader, value: freeHeader }
      ]
    },
    body: [cpuRow, memRow]
  }
}

/**
 * Command handler for `utilization cluster`
 *
 */
export async function clusterUtilization(args: Arguments): Promise<Table> {
  const [nodes, pods] = await Promise.all([getNodeData(args, true), getPodData(args, true)])

  return format(nodes, pods)
}

/**
 * Formatter for `utilization node`
 *
 */
function formatN(nodes: Table, allPods: Table): Table {
  const header = {
    name: 'Node',
    attributes: [
      { value: 'CPU Requests', outerCSS: 'hide-with-sidecar' },
      { value: 'CPU %Requests', outerCSS: 'hide-with-sidecar' },
      { value: 'CPU Limits', outerCSS: 'hide-with-sidecar' },
      { value: 'CPU %Limits' },
      { value: 'Mem Requests', outerCSS: 'hide-with-sidecar' },
      { value: 'Mem %Requests', outerCSS: 'hide-with-sidecar' },
      { value: 'Mem Limits', outerCSS: 'hide-with-sidecar' },
      { value: 'Mem %Limits' }
    ]
  }

  const body = nodes.body.map(node => {
    const ip = node.name
    const pods = { body: allPods.body.filter(_ => _.attributes[2].value === ip) }

    const allocCpu = fromTime(node.attributes[0].value)
    const allocMem = fromSize(node.attributes[1].value)
    const reqCpu = sumTime(pods, 3)
    const reqMem = sumSize(pods, 4)
    const limCpu = sumTime(pods, 5)
    const limMem = sumSize(pods, 6)

    const reqCpuText = cpuPretty(reqCpu)
    const reqMemText = memPretty(reqMem)
    const limCpuText = cpuPretty(limCpu)
    const limMemText = memPretty(limMem)

    const percentReqCpuText = calcPercentage(reqCpu, allocCpu)
    const percentReqMemText = calcPercentage(reqMem, allocMem)

    const percentLimCpuText = calcPercentage(limCpu, allocCpu)
    const percentLimMemText = calcPercentage(limMem, allocMem)

    /* const percentLimCpu_graph=allocCpu === 0 ? 0 : limCpu / allocCpu
    const percentLimMem_graph=allocMem === 0 ? 0 : limMem / allocMem
    const percentLimCpu_graph_input=percentLimCpu_graph
    const percentLimMem_graph_input=percentLimMem_graph */

    return {
      name: node.name,
      onclick: node.onclick,
      attributes: [
        { value: reqCpuText, outerCSS: 'hide-with-sidecar' },
        { value: percentReqCpuText, outerCSS: 'hide-with-sidecar' },
        { value: limCpuText, outerCSS: 'hide-with-sidecar' },
        { value: percentLimCpuText },
        { value: reqMemText, outerCSS: 'hide-with-sidecar' },
        { value: percentReqMemText, outerCSS: 'hide-with-sidecar' },
        { value: limMemText, outerCSS: 'hide-with-sidecar' },
        { value: percentLimMemText }
      ]
    }
  })

  return {
    header,
    body
  }
}

/**
 * Command handler for `utilization node`
 *
 */
export async function nodeUtilization(args: Arguments): Promise<Table> {
  const [nodes, pods] = await Promise.all([getNodeData(args, true), getPodData(args, true)])

  return formatN(nodes, pods)
}
