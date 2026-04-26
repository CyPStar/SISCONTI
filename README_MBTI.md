# MBTI 性格测试系统

## 项目结构

```
imouto-test/
├── src/
│   ├── App.vue              # 主应用组件 - 包含所有页面逻辑
│   ├── main.js              # 应用入口
│   ├── style.css            # 全局样式
│   ├── data/
│   │   └── questions.json   # 题目数据文件
│   └── utils/
│       └── analysis.js      # 答题分析逻辑
├── vite.config.js
└── package.json
```

## 功能设计

### 📄 页面流程（三个步骤）

1. **开始页面** (`start`)
   - 显示欢迎信息和题目数量
   - 提供"开始测试"按钮

2. **答题页面** (`testing`)
   - 显示进度条
   - 逐题显示问题和选项
   - 支持上一题/下一题导航
   - 选项选中后才能继续

3. **结果页面** (`result`)
   - 显示MBTI类型
   - 显示类型描述
   - 显示各维度的对比进度条
   - 提供重新测试按钮

## 数据结构

### questions.json 题目数据格式

```json
{
  "id": "q1",
  "question": "题目文本",
  "dimension": "E-I",  // 关联的心理学维度
  "options": [
    {
      "id": "q1_a",
      "label": "E",  // 维度标签（E/I/S/N/T/F/J/P）
      "text": "选项文本"
    }
  ]
}
```

### MBTI 四个维度

| 维度 | 维度1 | 维度2 | 说明 |
|------|-------|-------|------|
| E-I  | E (Extroversion) | I (Introversion) | 外向 vs 内向 |
| S-N  | S (Sensing) | N (Intuition) | 感知 vs 直觉 |
| T-F  | T (Thinking) | F (Feeling) | 思考 vs 感受 |
| J-P  | J (Judging) | P (Perceiving) | 判断 vs 知觉 |

## 如何扩展

### 1. 添加更多题目

编辑 `src/data/questions.json`，按照格式添加新题目即可。

**示例：**
```json
{
  "id": "q6",
  "question": "你最喜欢的工作方式是：",
  "dimension": "J-P",
  "options": [
    {
      "id": "q6_a",
      "label": "J",
      "text": "有明确的计划和截止日期"
    },
    {
      "id": "q6_b",
      "label": "P",
      "text": "保持灵活性，随机应变"
    }
  ]
}
```

### 2. 修改样式

在 `src/App.vue` 中修改 `<style scoped>` 部分，或在 `src/style.css` 中修改全局样式。

**常用颜色变量：**
```css
--primary-color: #667eea;      /* 主色调 */
--secondary-color: #764ba2;    /* 辅助色 */
--text-dark: #333;             /* 深色文字 */
--text-light: #666;            /* 浅色文字 */
```

### 3. 自定义MBTI类型描述

编辑 `src/utils/analysis.js` 中的 `MBTI_DESCRIPTIONS` 对象：

```javascript
const MBTI_DESCRIPTIONS = {
  'INTJ': '建筑师 - 您的自定义描述',
  // ... 其他类型
}
```

### 4. 添加详细的性格信息

在 `src/utils/analysis.js` 中补充 `getMBTIDetails()` 函数的内容，为每个MBTI类型添加详细信息：

```javascript
export function getMBTIDetails(type) {
  const details = {
    'INTJ': {
      name: '建筑师',
      strengths: ['战略规划', '独立分析'],
      weaknesses: ['情感表达'],
      careers: ['工程师', '科学家']
    },
    // ... 其他类型
  }
}
```

## 运行项目

```bash
# 安装依赖
npm install

# 开发服务器
npm run dev

# 生产构建
npm run build

# 预览构建
npm run preview
```

## 技术栈

- **Vue 3** - 渐进式JavaScript框架
- **Vite** - 下一代前端构建工具
- **CSS 3** - 现代样式表

## 分析算法说明

### 答题评分规则

每个选项都对应一个维度的标签（E/I/S/N/T/F/J/P）。系统会：

1. **累计维度分数**
   - 选择该维度的"+"标签时，分数+1
   - 选择该维度的"-"标签时，分数-1

2. **判断倾向方向**
   - 最终分数 > 0：倾向维度1（E/S/T/J）
   - 最终分数 < 0：倾向维度2（I/N/F/P）
   - 倾向度越强，分值相差越大

3. **生成最终类型**
   - 四个维度的倾向组合，得到16种可能的MBTI类型

### 维度对比显示

结果页面中的进度条显示各维度的倾向强弱：

- **百分比计算**：$((\text{score} + \text{总题数}) / (\text{总题数} \times 2)) \times 100$
- **百分比含义**：
  - 50% = 完全平衡
  - > 50% = 倾向维度1
  - < 50% = 倾向维度2

## 自定义建议

### 修改测试主题

1. 修改 `App.vue` 中的 `title` 和 `subtitle`
2. 修改 `header` 样式中的背景颜色

### 修改颜色方案

修改 `src/style.css` 中的CSS变量，整个应用会自动更新。

### 添加国际化

将所有文本提取到一个 `i18n.js` 文件中，使用i18n库实现多语言支持。

## 常见问题

**Q: 如何修改题目数量？**  
A: 在 `src/data/questions.json` 中添加或删除题目即可，系统会自动计算。

**Q: 如何修改MBTI类型为其他分类？**  
A: 修改 `dimension` 字段和选项的 `label` 字段，更新分析逻辑即可。

**Q: 如何实现数据持久化？**  
A: 在 `App.vue` 中使用 `localStorage` 或连接后端API保存答题记录。

