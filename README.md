# MemoNote

一个可以部署到 Cloudflare Workers + D1 + R2 的单用户笔记本。

当前版本支持：

- 用户名 / 密码登录，默认用户名 `admin`
- 画廊视图，卡片点击直接进入预览
- 预览页和编辑页分离，点“编辑”再进入修改模式
- 卡片正文只显示一行预览
- 主题切换
- 标签
- 右键菜单支持打开、复制内容、删除
- 置顶笔记会显示在左侧 Pin 区
- 附件上传
- 图片内联显示，PDF 和 Office 文件下载
- 删除笔记时同步删除附件，避免 R2 孤儿对象
- 按标题、正文、标签、附件文件名搜索

## 部署

### 一键部署到 Cloudflare

当前仓库地址：

https://github.com/shake/MemoNote

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/shake/MemoNote)

Cloudflare 会根据 `wrangler.jsonc` 自动创建 / 绑定 D1 和 R2，并根据 `.dev.vars.example` 提示填写 `ADMIN_USERNAME`、`ADMIN_PASSWORD` 和 `COOKIE_SECRET`。发布脚本会先执行 D1 migrations，再部署 Worker。

如果你 fork 了这个仓库，把上面的链接改成你自己的 fork 地址即可。

### 手动部署

Cloudflare 会根据 `wrangler.jsonc` 绑定 D1 和 R2。首次部署前，先准备好下面三个变量：

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `COOKIE_SECRET`

可以先运行下面的命令生成一个随机强密码，再填进 `ADMIN_PASSWORD`：

```bash
npm run gen:password
```

注意：这个项目的附件功能依赖 Cloudflare R2，部署前需要先在 Cloudflare 账号里通过 Dashboard 激活 R2。按你当前账号的控制台要求，开通时可能需要先绑定信用卡再继续。不启用的话，`wrangler deploy` 会在创建或绑定附件桶时失败。
如果你是从这个仓库 fork 到自己的 Cloudflare 账号，请先把 `wrangler.jsonc` 里的 `database_id`、`preview_database_id`、`bucket_name` 和 `preview_bucket_name` 填成你自己的资源值。

本地开发可以复制 `.dev.vars.example` 为 `.dev.vars` 后修改。

```bash
cp .dev.vars.example .dev.vars
npm run dev:local
```

如果你的环境可以直接使用 Wrangler 默认交互模式，也可以继续跑 `npm run dev`。

线上部署：

```bash
npm install
npx wrangler login
npx wrangler d1 migrations apply DB --remote
npx wrangler r2 bucket create memonote-attachments
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put COOKIE_SECRET
npm run deploy
```

如果 `memonote-attachments` 已经存在，`r2 bucket create` 那一步可以跳过；如果你的 Cloudflare 账号还没启用 R2，需要先在 Dashboard 里打开 R2 再继续。

如果你是在自己的 Cloudflare 账号里新建资源，先执行下面两步，再把返回值填回 `wrangler.jsonc`：

```bash
npx wrangler d1 create memonote-db
npx wrangler r2 bucket create memonote-attachments
```

## 数据说明

- 笔记正文和标签存 D1
- 附件元数据存 D1
- 附件文件存 R2

## 当前约定

- 附件必须绑定到笔记
- 删除笔记时会同步删除附件
- 不做回收站
- 不做附件加密
- 先保证“能找到、能删掉、能下载”
- 标签展示不带 `#`，界面更简洁
