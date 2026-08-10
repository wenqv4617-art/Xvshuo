# EDITORIAL 风格指南

Xvshuo 叙说 的视觉系统建立在**黑白灰高端编辑风**基础上，参考出版物 / 杂志的层级排版。

## 核心原则

1. **禁止 emoji**：所有图标必须是高质量通用路径 SVG（线性，1.5px 描边，24×24 viewBox）。
2. **禁止浏览器原生弹窗**：alert / confirm / prompt 全部替换为自定义卡片 modal 或 toast。
3. **强对比**：白底黑字、衬线大标题 + 无衬线正文。
4. **大留白**：页面外边距 64px 起，区块间距 48px。
5. **网格分隔**：细线（1px #e5e5e5）划分层级，必要时用粗线（#0a0a0a）。
6. **编号排版**：所有板块、列表使用编号（01 / 02 / 03 …），等宽字体显示。

## 颜色

| 变量 | 值 | 用途 |
|------|------|------|
| `--color-bg` | `#ffffff` | 主背景 |
| `--color-bg-alt` | `#f7f7f5` | 次级背景（微暖灰） |
| `--color-ink` | `#0a0a0a` | 主文字（近黑） |
| `--color-ink-soft` | `#404040` | 次级文字 |
| `--color-ink-muted` | `#8a8a8a` | 辅助文字 |
| `--color-line` | `#1a1a1a` | 强分隔线 |
| `--color-line-soft` | `#e5e5e5` | 弱分隔线 |
| `--color-danger` | `#b00020` | 危险操作 |
| `--color-success` | `#0a7a3a` | 成功提示 |

## 字体

- **正文**：`-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei"` 系统无衬线字体
- **标题**：`"Times New Roman", "Songti SC", "STSong"` 衬线字体（编辑风）
- **等宽**：`"SF Mono", "JetBrains Mono"` 编号 / 代码 / 正则

不引入 Google Fonts，确保离线 PWA 可用。

## 间距（8 倍数）

```
4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 / 96
```

## 圆角

克制：2px / 4px / 8px。编辑风偏直角，少用大圆角。

## 组件

- 按钮：primary（黑底白字）/ secondary（白底黑字）/ ghost（透明）/ danger（红色）
- 输入：1px 中灰边框，focus 黑色加粗 + 阴影
- 卡片：白底 + 细线边框，hover 微抬升 + 阴影
- Tab：下划线指示（黑色 2px）
- 手风琴：chevron 旋转动画
- Modal：全屏遮罩 + 居中卡片
- Toast：底部居中滑入，4 种类型

## SVG 图标尺寸约束

- 所有 `<svg>` 必须有显式 `width` / `height` 属性
- 全局 CSS 兜底：`svg { max-width: 100%; max-height: 100%; }`
- 容器约束：`.icon-btn svg` 等不超过 24px
- 防止裸 SVG 撑爆布局
