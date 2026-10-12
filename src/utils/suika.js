/**
 * 「合成大冰球」的等级配置与纯逻辑。
 *
 * 刻意与 Vue 和 matter.js 分开：这些是数据与判定规则，没有副作用，
 * 独立出来才能脱离界面直接测（合并规则是玩法的核心，值得单独锁住）。
 * 组件那边只负责物理世界、渲染循环与交互。
 */

/** 11 个等级，冰蓝色由浅到深 */
export const COLORS = [
  '#bfdcff',
  '#9dccf7',
  '#7bb9ee',
  '#59a5e3',
  '#3d8fd6',
  '#2878c2',
  '#1c63a8',
  '#144e88',
  '#0e3b68',
  '#09294b',
  '#051a31'
]

/**
 * 每级圆的**直径**（px）。
 *
 * 注意 matter.js 的 `Bodies.circle(x, y, r)` 要的是**半径**，
 * 所以构造刚体时一律要 `SIZES[level] / 2` —— 教程把这条列为矩形版改圆形版
 * 最容易出错的地方。最大一级直径 160px，因此容器宽度低于约 170px 时无法游玩。
 */
export const SIZES = [30, 39, 50, 64, 80, 98, 116, 132, 144, 152, 160]

/** 合成到第 n 级时获得的分数（第 0 级不会出现，占位为 0） */
export const SCORES = [0, 1, 2, 4, 6, 9, 12, 16, 20, 25, 30]

/** 等级总数 */
export const MAX_LEVEL = SIZES.length

/** 危险红线距容器顶部的距离（px） */
export const TOP_LINE = 86

/**
 * 判定「已停稳」的速度阈值。
 * 用它排除正在下落的圆 —— 下落瞬间也会穿过红线，但那是正常的，不该判负。
 */
export const SETTLED_SPEED = 0.7

/** 同一个圆连续多少次检查都在红线之上才判负（防抖，避免误判） */
export const OVER_STREAK_LIMIT = 3

/** 判负检查间隔（ms） */
export const CHECK_INTERVAL = 250

/** 新球只会是这几级之一 */
export const MIN_START_LEVEL = 1
export const MAX_START_LEVEL = 3

/** 容器比圆还窄时的理论下限：最大圆直径 + 两侧各 2px 余量 */
export const MIN_BOARD_WIDTH = SIZES[MAX_LEVEL - 1] + 4

/** 含两端的随机整数；random 可注入，便于测试 */
function randomInt(min, max, random = Math.random) {
  return min + Math.floor(random() * (max - min + 1))
}

/** 下一颗掉落的球是第几级 */
export function pickStartLevel(random = Math.random) {
  return randomInt(MIN_START_LEVEL, MAX_START_LEVEL, random)
}

/** 把圆心水平位置钳制在容器内，避免圆越出墙体 */
export function clampX(x, radius, width) {
  const min = radius + 2
  const max = width - radius - 2
  // 容器比圆还窄（极端窄屏）时退回居中，否则 min > max 会得到非法值
  if (max < min) return width / 2
  return Math.min(Math.max(x, min), max)
}

/**
 * 这一对刚体能否合并。逐条对应教程第 5 节的判断顺序，顺序不能随意调换。
 */
export function canMerge(a, b, maxLevel = MAX_LEVEL) {
  if (!a || !b) return false
  // 非游戏物（墙体等）没有 level
  if (a.level === undefined || b.level === undefined) return false
  if (a.isStatic || b.isStatic) return false
  // 本帧已经合并过的刚体要跳过：一次 collisionStart 里可能同时有多对接触，
  // 先处理的那对会把两个刚体标记掉，其余含它们的 pair 必须跳过，否则会重复合成
  if (a.merged || b.merged) return false
  if (a.level !== b.level) return false
  // 已经是最大等级，不再往上合成
  if (a.level >= maxLevel - 1) return false
  return true
}

/** 两个同级圆合成后的结果 */
export function mergeResult(level) {
  return { level: level + 1, score: SCORES[level + 1] ?? 0 }
}

/** 某个刚体是否「越过红线且已停稳」—— 判负条件之一 */
export function isOverLine(body, topLine = TOP_LINE, settledSpeed = SETTLED_SPEED) {
  if (!body || body.level === undefined || body.isStatic) return false
  return body.bounds.min.y < topLine && body.speed < settledSpeed
}
