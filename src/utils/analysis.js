import brotherTypes from '../data/brotherTypes.json'

const DIMENSIONS = [
  { name: '爱（Attachment）', key: 'attachment', description: '对妹妹的保护与担当程度' },
  { name: '控制（Control）', key: 'control', description: '对妹妹的管理和控制欲' },
  { name: '理性（Rationality）', key: 'rationality', description: '对妹妹人际关系的理性程度' },
  { name: '幻想（Fantasy）', key: 'fantasy', description: '二次元幻想的沉浸程度' },
  { name: '专一（Exclusivity）', key: 'exclusivity', description: '对妹妹爱的专一程度' }
]

// 五维参数上限
const MAX_DIMENSION_VALUE = 10

/**
 * 计算答题结果
 * @param {Object} answers - 用户的答题记录 { questionId: optionId }
 * @param {Array} questions - 题目数据
 * @returns {Object} 分析结果
 */
export function analyzeAnswers(answers, questions) {
  // 初始化五维参数
  const params = [0, 0, 0, 0, 0] // [attachment, control, rationality, fantasy, exclusivity]
  let answeredCount = 0

  // 累计所有选项的参数
  questions.forEach(question => {
    const selectedOptionId = answers[question.id];
    if (selectedOptionId) {
      answeredCount++
      const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
      if (selectedOption && selectedOption.params) {
        selectedOption.params.forEach((value, index) => {
          params[index] += value;
        });
      }
    }
  })

  // 计算平均值（每题最高10分，转换为0-10的平均值）
  const avgParams = params.map(p => answeredCount > 0 ? Math.round((p / answeredCount) * 10) / 10 : 0)

  // 计算最接近的三个哥哥类型（使用平均值比较）
  const topThreeTypes = findTopThreeTypes(avgParams)

  return {
    params: params,
    avgParams: avgParams,
    dimensionNames: DIMENSIONS,
    topThreeTypes: topThreeTypes,
    mainType: topThreeTypes[0],
    stats: {
      totalQuestions: questions.length,
      answeredQuestions: answeredCount,
      unansweredQuestions: questions.length - answeredCount
    }
  };
}

/**
 * 计算欧几里得距离
 * @param {Array} userParams - 用户的参数
 * @param {Array} typeParams - 哥哥类型的参数
 * @returns {Number} 距离
 */
function calculateEuclideanDistance(userParams, typeParams) {
  let distance = 0;
  for (let i = 0; i < userParams.length; i++) {
    distance += Math.pow(userParams[i] - typeParams[i], 2);
  }
  return Math.sqrt(distance);
}

/**
 * 找到最接近的三个哥哥类型
 * @param {Array} userParams - 用户的参数
 * @returns {Array} 最接近的三个类型
 */
function findTopThreeTypes(userParams) {
  // 计算与所有类型的距离
  const distances = brotherTypes.map((type, index) => {
    const distance = calculateEuclideanDistance(userParams, type.params);
    
    // 归一化相似度计算：最大可能距离为 sqrt(5 * 100) ≈ 22.36
    const maxDistance = Math.sqrt(5 * Math.pow(MAX_DIMENSION_VALUE, 2));
    const similarity = Math.round((1 - distance / maxDistance) * 10000) / 100;
    
    return {
      index: index,
      name: type.name,
      description: type.description,
      params: type.params,
      distance: distance,
      similarity: similarity
    };
  });

  // 排序并返回最接近的三个
  distances.sort((a, b) => b.similarity - a.similarity);
  return distances.slice(0, 3);
}

/**
 * 获取参数的可视化数据
 * @param {Array} params - 用户的参数（原始总分）
 * @param {Array} avgParams - 用户的平均值
 * @param {Array} topThreeTypes - 最接近的三个类型
 * @returns {Array} 可视化数据
 */
export function getVisualizationData(params, avgParams, topThreeTypes) {
  // 使用平均值计算百分比（最大值10分）
  return DIMENSIONS.map((dim, index) => {
    const value = avgParams[index];
    const percentage = Math.round((value / MAX_DIMENSION_VALUE) * 100);
    
    return {
      name: dim.name,
      rawValue: params[index],
      value: value,
      percentage: percentage
    };
  });
}

/**
 * 生成结果报告
 * @param {Object} analysisResult - 分析结果
 * @returns {String} 报告文本
 */
export function generateReport(analysisResult) {
  const { params, topThreeTypes, stats } = analysisResult;
  
  let report = `
=== SISCONTI 哥哥类型测试结果 ===

📊 回答统计：
- 已回答题目：${stats.answeredQuestions}/${stats.totalQuestions}
- 未回答题目：${stats.unansweredQuestions}

🎯 五维参数：
- 爱（Attachment）：${params[0]}
- 控制（Control）：${params[1]}
- 理性（Rationality）：${params[2]}
- 幻想（Fantasy）：${params[3]}
- 专一（Exclusivity）：${params[4]}

🏆 最接近的三个哥哥类型：

第一位：${topThreeTypes[0].name}
相似度：${topThreeTypes[0].similarity}%
描述：${topThreeTypes[0].description}

第二位：${topThreeTypes[1].name}
相似度：${topThreeTypes[1].similarity}%
描述：${topThreeTypes[1].description}

第三位：${topThreeTypes[2].name}
相似度：${topThreeTypes[2].similarity}%
描述：${topThreeTypes[2].description}
`;

  return report;
}

/**
 * 导出分析结果为JSON
 * @param {Object} analysisResult - 分析结果
 * @returns {String} JSON字符串
 */
export function exportAsJSON(analysisResult) {
  return JSON.stringify(analysisResult, null, 2);
}
