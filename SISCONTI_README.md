# SISCONTI - 你是什么样的哥哥？

## 项目简介

SISCONTI 是一套基于五维参数系统的性格测试，用于定位用户属于哪种"哥哥类型"。通过18道精心设计的问题，系统会分析你的五个维度，最后给出最相近的三个哥哥类型。

## 五个维度

| 维度 | 名称 | 说明 |
|------|------|------|
| 爱 (Attachment) | 爱与关心 | 对妹妹的爱与关心程度 |
| 控制 (Control) | 管控欲望 | 对妹妹的管控与占有欲 |
| 理性 (Rationality) | 理性冷静 | 理性与冷静程度 |
| 幻想 (Fantasy) | 幻想倾向 | 幻想与非现实的倾向 |
| 专一 (Exclusivity) | 专一独占 | 对妹妹的专一与独占欲 |

## 13个哥哥类型

1. **亚撒西（温柔）型妹控** - 温柔贴心，对妹妹充满爱意
2. **骨科型妹控** - 爱到极致，无法自拔
3. **痴情型妹控** - 一心一意，矢志不渝
4. **幻想型妹控** - 活在幻想中，沉浸于二次元
5. **博爱型妹控** - 宽容大度，不计较得失
6. **吐槽型妹控** - 嘴硬心软，表面冷淡
7. **傲娇型妹控** - 嘴欠心疼，既想管也想宠
8. **理智型妹控** - 冷静而理性，不为感情所动
9. **木头型妹控** - 木讷少言，默默守护
10. **凌辱型妹控** - 控制欲强，霸道专制
11. **NTR型妹控** - 暧昧而模糊，看似不在乎
12. **病娇型妹控** - 疯狂而偏执，无法放手
13. **重力型妹控** - 情绪化而不理性，容易失控

## 项目结构

```
src/
├── App.vue                    # 主应用组件
├── main.js                    # 应用入口
├── style.css                  # 全局样式
├── data/
│   ├── questions.json         # 18道题目数据
│   └── brotherTypes.json      # 13个哥哥类型数据
└── utils/
    └── analysis.js            # 参数分析和匹配算法
```

## 核心算法

### 1. 参数累计 (Accumulation)

用户每选择一个选项，系统都会将该选项对应的五个参数加到用户的总参数中：

$$UserParams[i] = \sum_{j=1}^{n} Option[j]_i \quad (i = 0 \text{ to } 4)$$

其中 $n$ 是已回答的题目数量。

### 2. 距离计算 (Euclidean Distance)

计算用户参数与每个哥哥类型参数之间的欧几里得距离：

$$Distance = \sqrt{\sum_{i=0}^{4}(UserParam_i - TypeParam_i)^2}$$

### 3. 类型匹配 (Type Matching)

距离最小的三个类型就是最相近的哥哥类型。同时计算相似度百分比：

$$Similarity = \frac{10000}{1 + Distance}$$

## 实时参数显示

在答题过程中，用户可以看到实时的五维参数值。这些数值会随着每次选择而更新，让用户了解自己的倾向。

### 参数值范围

- **最小值**：0（每题必选，最低总分）
- **最大值**：90（18题全选最高分数项，最高总分）

## 结果展示

完成测试后，系统将显示：

1. **五维参数图表** - 显示用户在各维度的绝对分值
2. **三个最接近的哥哥类型** - 按相似度排序
   - 第1位：类型名称、相似度、详细描述
   - 第2位：同上
   - 第3位：同上

## 使用方法

### 安装依赖

```bash
npm install
```

### 开发运行

```bash
npm run dev
```

### 生产构建

```bash
npm run build
```

### 预览构建

```bash
npm run preview
```

## 数据结构

### questions.json

```json
[
  {
    "id": 1,
    "text": "题目文本",
    "options": [
      {
        "id": "A",
        "label": "A",
        "text": "选项文本",
        "params": [爱, 控制, 理性, 幻想, 专一]
      }
    ]
  }
]
```

### brotherTypes.json

```json
[
  {
    "name": "类型名称",
    "description": "类型描述",
    "params": [爱, 控制, 理性, 幻想, 专一]
  }
]
```

## 如何扩展

### 添加新题目

编辑 `src/data/questions.json`，按照格式添加新题目。每个选项的 `params` 数组必须包含5个整数。

```json
{
  "id": 19,
  "text": "新题目？",
  "options": [
    {"id": "A", "label": "A", "text": "选项A", "params": [值1, 值2, 值3, 值4, 值5]},
    {"id": "B", "label": "B", "text": "选项B", "params": [值1, 值2, 值3, 值4, 值5]}
  ]
}
```

### 调整参数权重

修改各选项的 `params` 数组中的数值。数值越大，该选项对该维度的影响越大。

### 添加新的哥哥类型

编辑 `src/data/brotherTypes.json`，添加新类型：

```json
{
  "name": "新类型名称",
  "description": "新类型的详细描述",
  "params": [初始爱值, 初始控制值, 初始理性值, 初始幻想值, 初始专一值]
}
```

### 修改样式

修改 `src/App.vue` 中的 `<style scoped>` 部分，或编辑 `src/style.css` 修改全局样式。

### 导出结果

用户完成测试后，可以点击"导出结果"按钮下载JSON格式的测试结果。

## 技术栈

- **Vue 3** - 渐进式JavaScript框架
- **Vite** - 下一代前端构建工具
- **CSS 3** - 现代样式表

## 浏览器兼容性

- Chrome（最新版）
- Firefox（最新版）
- Safari（最新版）
- Edge（最新版）

## 常见问题

### Q: 如何修改测试标题？

A: 在 `src/App.vue` 中修改 `title` 和 `subtitle` 的初始值。

### Q: 如何改变颜色方案？

A: 修改 `src/App.vue` 中 CSS 变量：
- `#667eea` - 主色调
- `#764ba2` - 辅助色

### Q: 参数最高分数是多少？

A: 每个维度的最高分数取决于题目数量和每个选项的参数值。对于18题测试，通常在60-90之间。

### Q: 如何计算相似度？

A: 相似度是基于欧几里得距离计算的：`Similarity = 10000 / (1 + Distance) * 100%`

### Q: 用户数据如何保存？

A: 当前版本不保存用户数据。可以修改 `exportResult()` 方法使用本地存储或后端API。

## 代码示例

### 分析答题结果

```javascript
import { analyzeAnswers } from './utils/analysis'

const result = analyzeAnswers(answers, questions)
console.log(result.topThreeTypes)  // 获取最接近的三个类型
```

### 获取参数可视化数据

```javascript
import { getVisualizationData } from './utils/analysis'

const vizData = getVisualizationData(params, types)
```

## 版本信息

- **版本**: 1.0.0
- **最后更新**: 2026年4月
- **开发工具**: Vue 3 + Vite

## 许可证

MIT License

