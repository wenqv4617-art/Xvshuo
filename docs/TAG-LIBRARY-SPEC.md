# 标签库规范

Xvshuo 叙说 的标签库采用纯数据驱动，所有标签存储在 `scripts/data/tags-*.js`，UI 通过 `taglib` 组件按分类手风琴渲染。

## 文件清单

| 文件 | 用途 | 词条数 |
|------|------|------|
| `tags-appearance.js` | 外貌锚点（发型/面部/穿衣，按性别） | 716 |
| `tags-personality.js` | 性格特征（情绪/社交/认知/暗面） | 120+ |
| `tags-history.js` | 历史背景（时代/政体/科技/风气/矛盾） | 110+ |
| `tags-speech.js` | 语言风格（语速/用词/句式/语气/口音） | 110+ |
| `tags-relations.js` | 关系标签 | 47 |

## 数据结构

每个文件导出一个 IIFE，挂到 `window.TAGS_XXX`：

```js
window.TAGS_PERSONALITY = [
  { key: 'mood', label: '情绪基调', tags: ['冷淡','热烈', ...] }
];
```

`TAGS_APPEARANCE` 嵌套：

```js
window.TAGS_APPEARANCE = {
  hair: { female: [...], male: [...] },
  face: { female: [...], male: [...] },
  clothing: { female: [...], male: [...] }
};
```

## 扩展机制

用户可以在 UI 中通过"新增"按钮添加自定义标签，存到 `customTags` 表：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | UUID |
| category | string | `appearance-hair-short-ultra` / `personality-mood` 等 |
| gender | string | `female` / `male` / `all` |
| value | string | 标签文本 |
| createdAt | string | ISO |

`taglib` 组件在渲染时会合并预置标签和用户自定义标签（通过 category + gender 复合索引查询）。

## 维护建议

- 添加新词条：直接编辑 `tags-*.js` 数组
- 不要删除已有词条（会影响历史生成的档案）
- 大类调整时递增 `db.version()`
