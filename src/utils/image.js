/**
 * 浏览器端图片压缩。
 *
 * 图片最终会由 dev server 落盘到 public/images/（见 dev/contentApiPlugin.js），
 * 不受 localStorage 容量限制，但压缩仍然值得做：
 * 项目里的 PNG 立绘动辄 300–700KB，直接入库会让仓库和部署体积迅速膨胀。
 * 缩到 1600px 长边并转 WebP 后，单张通常降到 100–300KB，且肉眼看不出差别。
 *
 * 返回 data URL 而不是 Blob：接口约定用 data URL 传，服务端从 mime 前缀判断真实格式
 * （某些浏览器不支持 WebP 编码，会静默回退成 PNG，此时前缀是 image/png，服务端也能正确处理）。
 */

const MAX_EDGE = 1600
/** 逐步降质直到落到软上限以内 */
const QUALITY_STEPS = [0.85, 0.7, 0.55]
/** 软上限：超过就继续降质。不是硬性报错，只是为了别把仓库撑大 */
const SOFT_LIMIT_BYTES = 800 * 1024

export async function compressImageFile(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件（png / jpg / webp / gif）。')
  }

  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('这个图片格式浏览器无法解码，请换一张。')
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close?.()
    throw new Error('当前浏览器不支持画布压缩，请改用图片地址。')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  const originalWidth = bitmap.width
  const originalHeight = bitmap.height
  bitmap.close?.()

  // WebP 同时支持透明通道，体积也远小于 PNG
  let dataUrl = ''
  for (const quality of QUALITY_STEPS) {
    dataUrl = canvas.toDataURL('image/webp', quality)
    if (estimateBytes(dataUrl) <= SOFT_LIMIT_BYTES) break
  }

  return {
    dataUrl,
    bytes: estimateBytes(dataUrl),
    width,
    height,
    originalWidth,
    originalHeight
  }
}

/** 由 data URL 估算原始字节数（base64 每 4 个字符对应 3 字节） */
function estimateBytes(dataUrl) {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  return Math.round((base64.length * 3) / 4)
}
