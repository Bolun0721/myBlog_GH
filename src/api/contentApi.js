/**
 * 静态版的「写入接口」桩。
 *
 * 原版在 npm run dev 时由 dev/contentApiPlugin.js 提供 /__content-api，
 * 静态托管没有服务端，这里直接告诉调用方「不可写」。
 *
 * 为什么不保留原版由它自己去探测：
 * 原版会先对 /__content-api/status 发一次探测请求，在静态站点上必然 404
 * （GitHub Pages 会返回 404.html），既是一次白费的请求，也会在控制台/网络面板
 * 留下一个 404。直接返回 false 更干净，而且不依赖「探测失败要如何处理」。
 *
 * src/stores/content.js 拿到 false 后会进入只读模式，改动一律拒绝并提示 ——
 * 画集 / 音乐盒 / 个人项目三个栏因此天然只读，那份文件一行都不用改。
 */
export async function isApiAvailable() {
  return false
}

export async function saveContent() {
  throw new Error('静态展示版没有写入接口')
}

export async function uploadImage() {
  throw new Error('静态展示版没有写入接口')
}
