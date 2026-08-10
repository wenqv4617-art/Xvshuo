# 叙说 Xvshuo - AI 人设生成器

> 为 SillyTavern / StableDiffusion / Airp 等场景生成 user/char 人设、世界书、文风、正则的纯前端 PWA。

## 特性

- 纯前端 PWA，可安装到桌面，全屏使用，兼容 iOS / Android / 平板
- 完全本地数据：基于 IndexedDB（Dexie）的长期存储
- 五个 API 协议：OpenAI 官方 / Gemini 官方 / Anthropic 官方 / OpenAI 兼容 / 自定义模板
- AI 返回格式双协议：结构化 JSON / 自由文本（设置页切换）
- 黑白灰高端编辑风（EDITORIAL），全 SVG 图标，无原生弹窗
- 强制每次访问加载最新版本（四重缓存保险）

## 部署

### Vercel（主推）
1. 在 Vercel 导入本仓库
2. Framework Preset 选 **Other**
3. Output Directory 保持 `.`（根目录）
4. 部署完成

### GitHub Pages（镜像）
1. Settings → Pages → Source 选 **GitHub Actions**
2. Push 到 `main` 自动触发部署
3. ⚠️ GitHub Pages 默认 10 分钟缓存，更新可能滞后

## 本地开发

```bash
# 任选其一（SW 需要 https 或 localhost，http localhost 也可注册）
python3 -m http.server 8080
# 或
npx serve .
```

打开 http://localhost:8080

## 目录结构

```
/
├── index.html              # 唯一入口（所有页面作为 <section>）
├── manifest.json           # PWA 清单
├── sw.js                   # Service Worker
├── vercel.json             # Vercel 配置
├── styles/                 # 7 个 CSS（tokens/base/layout/components/pages/editorial/responsive）
├── scripts/
│   ├── app.js              # 应用入口
│   ├── router.js           # 路由管理
│   ├── db.js               # Dexie 数据层
│   ├── icons.js            # SVG 图标
│   ├── components/         # 通用组件
│   ├── pages/              # 8 个页面
│   ├── api/                # API 适配层（5 协议）
│   ├── generators/         # prompt 构建
│   ├── data/               # 标签库
│   └── utils/              # 工具
└── assets/icons/           # PWA 图标
```

## 数据安全

- 所有数据（人设 / API Key / 设置）均存于浏览器本地 IndexedDB
- 清除浏览器数据会丢失所有内容，**请定期通过设置 → 数据管理导出备份**
- API Key 明文存于本地（纯前端项目无后端），建议使用低额度 Key

## 许可证

MIT
