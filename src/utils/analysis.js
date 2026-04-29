import brotherTypes from '../data/brotherTypes.json'

const DIMENSIONS = [
  { name: '爱', key: 'attachment', description: '对妹妹的保护与担当程度' },
  { name: '控制', key: 'control', description: '对妹妹的管理和控制欲' },
  { name: '理性', key: 'rationality', description: '对妹妹人际关系的理性程度' },
  { name: '幻想', key: 'fantasy', description: '二次元幻想的沉浸程度' },
  { name: '专一', key: 'exclusivity', description: '对妹妹爱的专一程度' }
]

/**
 * 计算答题结果（累加模式）
 * @param {Object} answers - 用户的答题记录 { questionId: optionId }
 * @param {Array} questions - 题目数据
 * @returns {Object} 分析结果
 */
export function analyzeAnswers(answers, questions) {
  // 初始化五维参数（累加得分）
  const params = [0, 0, 0, 0, 0]
  let answeredCount = 0

  // 累加所有选项的参数
  questions.forEach(question => {
    const selectedOptionId = answers[question.id]
    if (selectedOptionId) {
      answeredCount++
      const selectedOption = question.options.find(opt => opt.id === selectedOptionId)
      if (selectedOption && selectedOption.params) {
        selectedOption.params.forEach((value, index) => {
          params[index] += value
        })
      }
    }
  })

  // 计算最接近的哥哥类型（使用欧几里得距离匹配）
  const matchedTypes = findMatchedTypes(params)

  return {
    params: params,
    dimensionNames: DIMENSIONS,
    topThreeTypes: matchedTypes,
    mainType: matchedTypes[0],
    stats: {
      totalQuestions: questions.length,
      answeredQuestions: answeredCount,
      unansweredQuestions: questions.length - answeredCount
    }
  }
}

/**
 * 计算欧几里得距离
 */
function calculateEuclideanDistance(userParams, typeParams) {
  let distance = 0
  for (let i = 0; i < userParams.length; i++) {
    distance += Math.pow(userParams[i] - typeParams[i], 2)
  }
  return Math.sqrt(distance)
}

/**
 * 找到最匹配的三个哥哥类型
 */
function findMatchedTypes(userParams) {
  // 计算与所有类型的距离
  const distances = brotherTypes.map((type, index) => {
    const distance = calculateEuclideanDistance(userParams, type.params)
    
    // 归一化相似度：最大可能距离约为 sqrt(5 * 1440) ≈ 84.85
    const maxPossibleScore = questions => {
      let max = 0
      questions.forEach(q => {
        q.options.forEach(opt => {
          if (opt.params) {
            for (let i = 0; i < 5; i++) {
              max += opt.params[i]
            }
          }
        })
      })
      return max
    }
    
    // 简化：使用一个合理的最大值
    const maxDistance = 200
    const similarity = Math.max(0, Math.round((1 - distance / maxDistance) * 100))
    
    return {
      index: index,
      name: type.name,
      description: type.description,
      params: type.params,
      distance: Math.round(distance * 100) / 100,
      similarity: similarity
    }
  })

  // 排序并返回最接近的三个
  distances.sort((a, b) => {
    if (b.similarity !== a.similarity) return b.similarity - a.similarity
    return a.distance - b.distance
  })
  return distances.slice(0, 3)
}

/**
 * 获取参数的可视化数据
 */
export function getVisualizationData(params, topThreeTypes) {
  // 累加模式下，最大值是所有题目最高选项的累加
  const maxValues = [120, 111, 117, 111, 113] // 各维度的理论最大值
  
  return DIMENSIONS.map((dim, index) => {
    const value = params[index]
    const percentage = Math.min(100, Math.round((value / maxValues[index]) * 100))
    
    return {
      name: dim.name,
      rawValue: value,
      percentage: percentage
    }
  })
}

/**
 * 生成结果报告
 */
export function generateReport(analysisResult) {
  const { params, topThreeTypes, stats } = analysisResult
  
  let report = `
=== SISCONTI 哥哥类型测试结果 ===

答题统计：
- 已回答题目：${stats.answeredQuestions}/${stats.totalQuestions}
- 未回答题目：${stats.unansweredQuestions}

五维参数（累加得分）：
- 爱（Attachment）：${params[0]}
- 控制（Control）：${params[1]}
- 理性（Rationality）：${params[2]}
- 幻想（Fantasy）：${params[3]}
- 专一（Exclusivity）：${params[4]}

最接近的三个哥哥类型：

第一位：${topThreeTypes[0].name}
相似度：${topThreeTypes[0].similarity}%
距离：${topThreeTypes[0].distance}
描述：${topThreeTypes[0].description}

第二位：${topThreeTypes[1].name}
相似度：${topThreeTypes[1].similarity}%
描述：${topThreeTypes[1].description}

第三位：${topThreeTypes[2].name}
相似度：${topThreeTypes[2].similarity}%
描述：${topThreeTypes[2].description}
`;

  return report
}

/**
 * 导出分析结果为JSON
 */
export function exportAsJSON(analysisResult) {
  return JSON.stringify(analysisResult, null, 2)
}
