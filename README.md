# Time Cat · 静态展示版

这是 [Time Cat 主站](https://github.com/Bolun0721) 的**纯静态版本**，用于托管在 GitHub Pages。

> ⚠️ **本目录由 `my-blog/scripts/sync-static.mjs` 自动生成，请不要手工编辑。**
> 任何改动都会在下次同步时被覆盖。要改内容或代码，请回到 `my-blog` 项目修改。

## 与原版的区别

| | 主站 | 本静态版 |
|---|---|---|
| 后端 | Node + SQLite（账号、会话、文章、说说） | **无**，纯静态 |
| 登录 / 注册 | 可用 | 按钮保留，点击弹出「静态版无法实现」说明 |
| 发表说说 | 可用 | 输入框保留，点「发布」弹出说明 |
| 写文章 | 管理员可用 | 无写作面板，只读展示 |
| 内容管理 `/admin` | 可用 | 不存在 |
| 画集 / 音乐盒 / 项目 | — | 完全一致 |
| 像素画板 | — | 完全一致（本来就是纯前端） |

文章与说说的内容来自本地库的导出快照（`src/data/articles.json`、`src/data/moments.json`），
所以内容仍然在本地用完整版维护，静态版只是它的只读镜像。

## 本地预览

```bash
npm install
npm run dev            # http://localhost:5173/myBlog_GH/
```

注意地址里带 `/myBlog_GH/` —— 项目站点的 `base` 就是这个仓库名。

## 构建

```bash
npm run build          # 产物在 dist/
npm run preview        # 本地预览构建产物
```

## 部署到 GitHub Pages

1. 在 GitHub 上新建仓库。仓库名决定访问地址：
   `https://<用户名>.github.io/<仓库名>/`
2. 把本目录推上去：
   ```bash
   git init -b main
   git add .
   git commit -m "deploy: Time Cat 静态版"
   git remote add origin git@github.com:<用户名>/<仓库名>.git
   git push -u origin main
   ```
3. 仓库 → **Settings → Pages** → **Source** 选 **GitHub Actions**。
4. 推送后 Actions 会自动构建并发布，约 1–3 分钟。地址在 Actions 的 deploy 步骤里能看到。

## ⚠️ 仓库名和 base 必须一致

`vite.config.js` 里的 `base` 默认是 `/myBlog_GH/`。**如果你的仓库名不是 `myBlog_GH`，
构建产物里的所有 CSS/JS 路径都会指向错误的地址，整站白屏。**

改法（回到主项目重新同步，不要在本地改）：

```bash
cd ../my-blog
npm run sync:static -- --base=/你的仓库名/
```

## 深层链接是怎么工作的

本站是单页应用，用 history 路由。直接访问 `/music`、`/articles/xxx` 这类地址时，
GitHub Pages 找不到对应文件会返回 `404.html`。那个文件会把原始路径改写后跳回首页，
由首页的脚本还原成真实路径交给前端路由 —— 所以**刷新深层链接和直接分享链接都能正常工作**。

这套机制依赖 `public/404.html` 里的 `pathSegmentsToKeep = 1`（保留路径第一段 = 仓库名）。
如果哪天改成用户站点（`用户名.github.io`，没有仓库名这一段），这里要改成 `0`。

## 内容更新流程

```bash
# 1. 在完整版里改内容（写作、发说说、管理画集等）
cd ../my-blog
npm run dev            # 用 /admin 或文章面板改动

# 2. 重新生成静态版
npm run sync:static

# 3. 推送
cd ../myBlog_GH
git add .
git commit -m "content: 更新内容"
git push
```

推上去之后 Actions 会自动重新部署。

## 关于音频体积

`public/audio` 约 48 MB。GitHub Pages 的软限制是 100 GB/月 带宽，
换算下来大约 2000 次完整收听会触顶 —— 个人站点通常够用，但值得知道。

## 注意事项

- **`data/` 不在本仓库里**：账号、口令哈希、原始数据库都在主项目的 `my-blog/data/`，
  需要单独备份，git 不覆盖它。
- GitHub Pages 只支持静态内容，没有服务端，所以登录、发布这类功能在本版**不可能**实现，
  这不是 bug。
- 建议把仓库设为 **Public**：免费账号的 Pages 只对公开仓库可用。
