import brotherTypes from '../data/brotherTypes.json'

const DIMENSIONS = [
  { name: '爱', key: 'attachment', description: '对妹妹的保护与担当程度' },
  { name: '控制', key: 'control', description: '对妹妹的管理和控制欲' },
  { name: '理性', key: 'rationality', description: '对妹妹人际关系的理性程度' },
  { name: '幻想', key: 'fantasy', description: '二次元幻想的沉浸程度' },
  { name: '专一', key: 'exclusivity', description: '对妹妹爱的专一程度' }
]

// 维度权重（用于差异放大）
const DIM_WEIGHTS = [1.2, 1.5, 1.3, 1.0, 1.4]

// 题目权重配置
function getQuestionWeight(questionId) {
  if (questionId <= 10) return 1        // 日常行为
  if (questionId <= 18) return 1.2       // 关系认知
  // 19~24题：权重 1.5~2（极端/价值观）
  const baseWeight = 1.5
  const extraWeight = ((questionId - 19) / 6) * 0.5
  return Math.min(2, baseWeight + extraWeight)
}

/**
 * 计算加权基础分（归一化到 0~10 范围）
 */
function calculateWeightedScores(answers, questions) {
  const rawParams = [0, 0, 0, 0, 0]
  let totalWeight = 0

  questions.forEach(question => {
    const selectedOptionId = answers[question.id]
    if (!selectedOptionId) return

    const selectedOption = question.options.find(opt => opt.id === selectedOptionId)
    if (!selectedOption || !selectedOption.params) return

    const weight = getQuestionWeight(question.id)
    totalWeight += weight

    for (let i = 0; i < 5; i++) {
      rawParams[i] += selectedOption.params[i] * weight
    }
  })

  // 归一化到 0~10 范围（基于最大可能得分估算）
  // 单题最大约 10 分 * 权重2 ≈ 20分/题 * 24题 ≈ 480总分
  // 归一化系数约为 48
  const normalizeFactor = totalWeight > 0 ? totalWeight * 4.8 : 48
  const normalizedParams = rawParams.map(v =>
    Math.max(0, Math.min(10, v / normalizeFactor * 10))
  )

  return {
    raw: rawParams,
    normalized: normalizedParams,
    totalWeight: totalWeight
  }
}

/**
 * 收集所有选择的标签
 */
function collectTags(answers, questions) {
  const tagCounts = {}

  questions.forEach(question => {
    const selectedOptionId = answers[question.id]
    if (!selectedOptionId) return

    const selectedOption = question.options.find(opt => opt.id === selectedOptionId)
    if (!selectedOption || !selectedOption.tags) return

    selectedOption.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })

  return tagCounts
}

/**
 * 计算余弦相似度（使用维度权重放大差异）
 */
function calculateCosineSimilarity(userParams, typeParams) {
  let dotProduct = 0
  let userMag = 0
  let typeMag = 0

  for (let i = 0; i < 5; i++) {
    const wUser = userParams[i] * DIM_WEIGHTS[i]
    const wType = typeParams[i] * DIM_WEIGHTS[i]
    dotProduct += wUser * wType
    userMag += wUser * wUser
    typeMag += wType * wType
  }

  userMag = Math.sqrt(userMag)
  typeMag = Math.sqrt(typeMag)

  if (userMag === 0 || typeMag === 0) return 0
  return dotProduct / (userMag * typeMag)
}

/**
 * 计算区间匹配度
 */
function calculateRangeScore(userParams, typeRange) {
  let matchedCount = 0
  for (let i = 0; i < 5; i++) {
    const val = userParams[i]
    const range = typeRange[i]
    if (val >= range[0] && val <= range[1]) {
      matchedCount++
    }
  }
  return matchedCount / 5
}

/**
 * 计算标签匹配分数
 */
function calculateTagScore(userTagCounts, typeTags) {
  if (!typeTags || typeTags.length === 0) return 0.5 // 默认中等分
  let matchCount = 0
  typeTags.forEach(tag => {
    if (userTagCounts[tag] && userTagCounts[tag] > 0) {
      matchCount++
    }
  })
  return matchCount / typeTags.length
}

/**
 * 极端触发机制检测（优先级最高）
 */
function checkExtremeTriggers(normalizedParams, tagCounts) {
  // 病娇型触发
  if (
    normalizedParams[1] >= 8 &&
    normalizedParams[2] <= 3 &&
    (tagCounts['extreme'] >= 2 || tagCounts['violent'] >= 2 || tagCounts['control'] >= 3)
  ) {
    return brotherTypes.find(t => t.name.includes('病娇'))
  }

  // 凌辱型触发
  if (
    normalizedParams[1] >= 9 &&
    (tagCounts['control'] >= 2 && tagCounts['dominance'] >= 1)
  ) {
    return brotherTypes.find(t => t.name.includes('凌辱'))
  }

  // 痴情型触发
  if (
    normalizedParams[0] >= 9 &&
    normalizedParams[4] >= 9 &&
    (tagCounts['sacrifice'] >= 2 || tagCounts['exclusive'] >= 3)
  ) {
    return brotherTypes.find(t => t.name.includes('痴情'))
  }

  return null
}

/**
 * 异常惩罚机制
 */
function applyAnomalyPenalty(finalScore, userParams, typeParams) {
  // 如果控制维差值超过4，惩罚
  const ctrlDiff = Math.abs(userParams[1] - typeParams[1])
  if (ctrlDiff > 4) {
    finalScore -= 0.2
  }

  // 理性维差值超过4也惩罚
  const ratDiff = Math.abs(userParams[2] - typeParams[2])
  if (ratDiff > 4) {
    finalScore -= 0.15
  }

  return Math.max(0, finalScore)
}

/**
 * 主分析函数
 */
export function analyzeAnswers(answers, questions) {
  // 1. 计算加权基础分
  const scoreResult = calculateWeightedScores(answers, questions)
  const normalizedParams = scoreResult.normalized

  // 2. 收集标签
  const tagCounts = collectTags(answers, questions)

  // 3. 检查极端触发条件（优先级最高）
  const extremeType = checkExtremeTriggers(normalizedParams, tagCounts)
  if (extremeType) {
    const similarity = 95
    return buildResult(scoreResult.raw, normalizedParams, [{
      index: brotherTypes.indexOf(extremeType),
      name: extremeType.name,
      description: extremeType.description,
      params: extremeType.params,
      similarity: similarity,
      finalScore: similarity / 100,
      triggeredBy: 'extreme'
    }], tagCounts, answers.length, Object.keys(answers).length, true)
  }

  // 4. 对每种类型计算最终评分
  const typeScores = brotherTypes.map((type, index) => {
    const cosSim = calculateCosineSimilarity(normalizedParams, type.params)
    const rangeScore = calculateRangeScore(normalizedParams, type.range || type.defaultRange)
    const tagScore = calculateTagScore(tagCounts, type.tags || [])

    // 最终评分融合：50%余弦相似 + 30%区间匹配 + 20%标签匹配
    let finalScore = 0.5 * cosSim + 0.3 * rangeScore + 0.2 * tagScore

    // 应用异常惩罚
    finalScore = applyAnomalyPenalty(finalScore, normalizedParams, type.params)

    return {
      index: index,
      name: type.name,
      description: type.description,
      params: type.params,
      cosineSimilarity: Math.round(cosSim * 100),
      rangeScore: Math.round(rangeScore * 100),
      tagScore: Math.round(tagScore * 100),
      finalScore: Math.round(finalScore * 100),
      similarity: Math.round(finalScore * 100) // 兼容旧接口
    }
  })

  // 按 finalScore 排序
  typeScores.sort((a, b) => b.finalScore - a.finalScore)
  const topThree = typeScores.slice(0, 3)

  return buildResult(
    scoreResult.raw,
    normalizedParams,
    topThree,
    tagCounts,
    questions.length,
    Object.keys(answers).length,
    false
  )
}

/**
 * 构建结果对象
 */
function buildResult(rawParams, normalizedParams, topThreeTypes, tagCounts, totalQ, answeredQ, isExtreme) {
  return {
    params: rawParams,
    normalizedParams: normalizedParams,
    dimensionNames: DIMENSIONS,
    topThreeTypes: topThreeTypes,
    mainType: topThreeTypes[0],
    tagCounts: tagCounts,
    isExtremeTriggered: isExtreme,
    stats: {
      totalQuestions: totalQ,
      answeredQuestions: answeredQ,
      unansweredQuestions: totalQ - answeredQ
    }
  }
}

/**
 * 获取参数的可视化数据（使用归一化后的 0~10 分值）
 */
export function getVisualizationData(params, topThreeTypes) {
  // 使用归一化参数（如果有的话）或原始参数做百分比转换
  const displayParams = params.normalizedParams || params
  const maxVal = 10 // 归一化后范围是 0~10

  return DIMENSIONS.map((dim, index) => {
    const value = displayParams[index] !== undefined ? displayParams[index] : (params[index] || 0)
    // 如果是原始累加值，用旧的maxValues；如果是归一化值，用10作为满分
    const isNormalized = displayParams === params.normalizedParams || value <= 15
    const percentage = isNormalized
      ? Math.min(100, Math.round((value / maxVal) * 100))
      : Math.min(100, Math.round((value / [120, 111, 117, 111, 113][index]) * 100))

    return {
      name: dim.name,
      rawValue: typeof value === 'number' ? Math.round(value * 10) / 10 : value,
      percentage: percentage
    }
  })
}

/**
 * 生成结果报告
 */
export function generateReport(analysisResult) {
  const { params, normalizedParams, topThreeTypes, stats, tagCounts } = analysisResult

  const displayParams = normalizedParams || params
  let report = `
=== SISCONTI 哥哥类型测试结果 ===

${analysisResult.isExtremeTriggered ? '⚠️ 检测到极端人格特征触发！\n' : ''}

答题统计：
- 已回答题目：${stats.answeredQuestions}/${stats.totalQuestions}
- 未回答题目：${stats.unansweredQuestions}

五维参数得分（归一化 0~10）：
- 爱（Attachment）：${Math.round(displayParams[0] * 10) / 10}
- 控制（Control）：${Math.round(displayParams[1] * 10) / 10}
- 理性（Rationality）：${Math.round(displayParams[2] * 10) / 10}
- 幻想（Fantasy）：${Math.round(displayParams[3] * 10) / 10}
- 专一（Exclusivity）：${Math.round(displayParams[4] * 10) / 10}

行为标签统计：
${Object.keys(tagCounts).length > 0 ? Object.entries(tagCounts).map(([k, v]) => `- ${k}: ${v}次`).join('\n') : '- 无显著标签'}

最接近的三个哥哥类型：

第一位：${topThreeTypes[0].name}
综合评分：${topThreeTypes[0].similarity}%
${topThreeTypes[0].cosineSimilarity ? `  余弦相似: ${topThreeTypes[0].cosineSimilarity}% | 区间匹配: ${topThreeTypes[0].rangeScore}% | 标签匹配: ${topThreeTypes[0].tagScore}%` : ''}
描述：${topThreeTypes[0].description}
${topThreeTypes[0].triggeredBy ? `[由极端触发机制匹配]` : ''}
`

  if (topThreeTypes[1]) {
    report += `
第二位：${topThreeTypes[1].name}
综合评分：${topThreeTypes[1].similarity}%
描述：${topThreeTypes[1].description}
`
  }

  if (topThreeTypes[2]) {
    report += `
第三位：${topThreeTypes[2].name}
综合评分：${topThreeTypes[2].similarity}%
描述：${topThreeTypes[2].description}
`
  }

  return report
}

/**
 * 导出分析结果为JSON
 */
export function exportAsJSON(analysisResult) {
  return JSON.stringify(analysisResult, null, 2)
}
