<template>
  <div class="sisconti-container">
    <!-- 头部 -->
    <header class="header">
      <h1>{{ title }}</h1>
      <p class="subtitle">{{ subtitle }}</p>
    </header>

    <!-- 主容器 -->
    <main class="main-content">
      <!-- 开始页面 -->
      <section v-if="currentStep === 'start'" class="start-page">
        <div class="welcome-box">
          <h2>欢迎参加 SISCONTI 测试</h2>
          <p class="test-count">该测试包含 {{ totalQuestions }} 道题目</p>
          <p class="description">该题目情景只针对二次元哦~ 与现实无关 ，仅供娱乐，请勿当真~</p>
          <button @click="startTest" class="btn-primary">开始测试</button>
        </div>
      </section>

      <!-- 答题页面 -->
      <section v-else-if="currentStep === 'testing'" class="testing-page">
        <!-- 进度条 -->
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <p class="progress-text">第 {{ currentQuestionIndex + 1 }} / {{ totalQuestions }} 题</p>
        </div>

        <!-- 题目卡片 -->
        <div class="question-card">
          <h2 class="question-title">{{ currentQuestion.text }}</h2>
          
          <div class="options-container">
            <button
              v-for="option in currentQuestion.options"
              :key="option.id"
              @click="selectAnswer(option)"
              class="option-btn"
              :class="{ 'selected': selectedAnswer === option.id }"
            >
              <span class="option-label">{{ option.label }}</span>
              <span class="option-text">{{ option.text }}</span>
            </button>
          </div>

          <!-- 导航按钮 -->
          <div class="navigation">
            <button
              @click="previousQuestion"
              :disabled="currentQuestionIndex === 0"
              class="btn-secondary"
            >
              ← 上一题
            </button>
            <button
              @click="nextQuestion"
              :disabled="!selectedAnswer"
              class="btn-primary"
            >
              {{ currentQuestionIndex === totalQuestions - 1 ? '完成' : '下一题 →' }}
            </button>
          </div>
        </div>
      </section>

      <!-- 结果页面 -->
      <section v-else-if="currentStep === 'result'" class="result-page">
        <div class="result-container">
          <!-- 五维参数显示 -->
          <div class="params-section">
            <h2>你的五维参数（平均值）</h2>
            <p class="avg-note">每题最高10分，你的平均得分</p>
            <div class="params-chart">
              <div class="param-row" v-for="(dim, index) in result.currentParams" :key="index">
                <span class="dim-label">{{ dim.name }}</span>
                <div class="param-bar">
                  <div class="param-fill" :style="{ width: dim.percentage + '%' }"></div>
                </div>
                <span class="dim-value">{{ dim.value }} <span class="raw-value">/ {{ dim.rawValue }}分</span></span>
              </div>
            </div>
          </div>

          <!-- 三个最接近的类型 -->
          <div class="types-section">
            <h2>最接近的三个妹控类型</h2>
            <div class="types-container">
              <div
                class="type-card"
                v-for="(type, index) in result.topThreeTypes"
                :key="index"
                :class="{ 'rank-1': index === 0, 'rank-2': index === 1, 'rank-3': index === 2 }"
              >
                <div class="type-rank-badge">
                  <span v-if="index === 0">🥇</span>
                  <span v-else-if="index === 1">🥈</span>
                  <span v-else>🥉</span>
                  第{{ index + 1 }}位
                </div>
                <div class="type-name">{{ type.name }}</div>
                <div class="type-similarity">{{ type.similarity }}% 匹配</div>
                <div class="type-params-mini">
                  <span v-for="(val, idx) in type.params" :key="idx" class="param-mini-item">
                    {{ ['爱', '控', '理', '幻', '专'][idx] }}:{{ val }}
                  </span>
                </div>
                <p class="type-description">{{ type.description }}</p>
                <div class="type-match-bar">
                  <div class="match-fill" :style="{ width: type.similarity + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="result-actions">
            <button @click="restartTest" class="btn-primary">重新测试</button>
            <button @click="exportResult" class="btn-secondary">导出结果</button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import questions from './data/questions.json'
import brotherTypes from './data/brotherTypes.json'
import { analyzeAnswers, getVisualizationData } from './utils/analysis'

// 五维参数定义
const DIMENSIONS = [
  { name: '爱', fullName: '爱（Attachment）', description: '对妹妹的保护与担当程度' },
  { name: '控制', fullName: '控制（Control）', description: '对妹妹的管理和控制欲' },
  { name: '理性', fullName: '理性（Rationality）', description: '对妹妹人际关系的理性程度' },
  { name: '幻想', fullName: '幻想（Fantasy）', description: '二次元幻想的沉浸程度' },
  { name: '专一', fullName: '专一（Exclusivity）', description: '对妹妹爱的专一程度' }
]

export default {
  name: 'App',
  data() {
    return {
      title: 'SISCONTI - 你是什么样的妹控？',
      subtitle: '五维性格测试',
      currentStep: 'start', // start, testing, result
      currentQuestionIndex: 0,
      questions: [],
      answers: {}, // { questionId: optionId }
      selectedAnswer: null,
      result: null,
      brotherTypes: []
    }
  },
  computed: {
    totalQuestions() {
      return this.questions.length
    },
    currentQuestion() {
      return this.questions[this.currentQuestionIndex]
    },
    progressPercent() {
      return ((this.currentQuestionIndex + 1) / this.totalQuestions) * 100
    },
    // 当前累计参数
    currentParams() {
      const params = [0, 0, 0, 0, 0]
      
      Object.keys(this.answers).forEach(questionId => {
        const question = this.questions.find(q => q.id === parseInt(questionId))
        if (question) {
          const selectedOptionId = this.answers[questionId]
          const selectedOption = question.options.find(opt => opt.id === selectedOptionId)
          if (selectedOption && selectedOption.params) {
            selectedOption.params.forEach((value, index) => {
              params[index] += value
            })
          }
        }
      })

      return params
    }
  },
  methods: {
    startTest() {
      this.currentStep = 'testing'
      this.loadQuestion()
    },
    loadQuestion() {
      const question = this.currentQuestion
      this.selectedAnswer = this.answers[question.id] || null
    },
    selectAnswer(option) {
      // 只保存选择，不显示变化
      this.selectedAnswer = option.id
      this.answers[this.currentQuestion.id] = option.id
    },
    nextQuestion() {
      if (this.currentQuestionIndex < this.totalQuestions - 1) {
        this.currentQuestionIndex++
        this.loadQuestion()
      } else {
        this.submitTest()
      }
    },
    previousQuestion() {
      if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--
        this.loadQuestion()
      }
    },
    submitTest() {
      // 分析答题结果
      const analysisResult = analyzeAnswers(this.answers, this.questions)
      
      // 获取参数可视化数据
      const currentParams = getVisualizationData(analysisResult.params, analysisResult.avgParams, analysisResult.topThreeTypes)
      
      this.result = {
        ...analysisResult,
        currentParams: currentParams
      }
      
      this.currentStep = 'result'
    },
    restartTest() {
      this.currentStep = 'start'
      this.currentQuestionIndex = 0
      this.answers = {}
      this.selectedAnswer = null
      this.result = null
    },
    exportResult() {
      if (!this.result) return
      
      const reportData = {
        timestamp: new Date().toLocaleString(),
        totalQuestions: this.totalQuestions,
        answeredQuestions: Object.keys(this.answers).length,
        params: {
          attachment: this.result.params[0],
          control: this.result.params[1],
          rationality: this.result.params[2],
          fantasy: this.result.params[3],
          exclusivity: this.result.params[4]
        },
        topThreeTypes: this.result.topThreeTypes.map(t => ({
          name: t.name,
          description: t.description,
          similarity: t.similarity
        }))
      }
      
      const dataStr = JSON.stringify(reportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `SISCONTI-result-${Date.now()}.json`
      link.click()
      URL.revokeObjectURL(url)
    }
  },
  mounted() {
    this.questions = questions
    this.brotherTypes = brotherTypes
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.sisconti-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

.header {
  background: rgba(0, 0, 0, 0.1);
  color: white;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
}

.main-content {
  flex: 1;
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow-y: auto;
}

/* ===== 开始页面 ===== */
.start-page {
  width: 100%;
  max-width: 500px;
}

.welcome-box {
  background: white;
  padding: 3rem 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
  animation: slideUp 0.5s ease-out;
}

.welcome-box h2 {
  color: #333;
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

.test-count {
  color: #667eea;
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.description {
  color: #999;
  font-size: 0.9rem;
  margin: 1.5rem 0 2rem 0;
  line-height: 1.6;
}

/* ===== 答题页面 ===== */
.testing-page {
  width: 100%;
  max-width: 800px;
}

.progress-container {
  margin-bottom: 2rem;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: white;
  transition: width 0.3s ease;
}

.progress-text {
  color: white;
  text-align: right;
  font-size: 0.9rem;
}

.question-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.5s ease-out;
}

.question-title {
  color: #333;
  font-size: 1.4rem;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.option-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 1.2rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  font-size: 1rem;
}

.option-btn:hover {
  border-color: #667eea;
  background: #f5f5ff;
}

.option-btn.selected {
  border-color: #667eea;
  background: #f0f4ff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.option-label {
  display: inline-block;
  background: #667eea;
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.option-text {
  color: #333;
}

.navigation {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

/* ===== 结果页面 ===== */
.result-page {
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
}

.result-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 2.5rem;
  animation: slideUp 0.5s ease-out;
}

/* 参数部分 */
.params-section h2,
.types-section h2 {
  color: #333;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #667eea;
  padding-bottom: 1rem;
}

.params-chart {
  margin-bottom: 2rem;
}

.param-row {
  display: grid;
  grid-template-columns: 80px 1fr 100px;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.dim-label {
  font-weight: bold;
  color: #333;
}

.param-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.param-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
}

.dim-value {
  text-align: right;
  color: #667eea;
  font-weight: bold;
  font-size: 1.1rem;
}

.raw-value {
  font-size: 0.8rem;
  color: #999;
  font-weight: normal;
}

.avg-note {
  color: #999;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  font-style: italic;
}

/* 类型部分 */
.types-section {
  margin-top: 2rem;
}

.types-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.type-card {
  background: linear-gradient(135deg, #f5f5ff 0%, #ffffff 100%);
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  text-align: center;
}

.type-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.2);
  border-color: #667eea;
}

.type-card.rank-1 {
  border-color: #ffd700;
  background: linear-gradient(135deg, #fffef0 0%, #fffbf0 100%);
}

.type-card.rank-2 {
  border-color: #c0c0c0;
  background: linear-gradient(135deg, #f5f5ff 0%, #ffffff 100%);
}

.type-card.rank-3 {
  border-color: #cd7f32;
  background: linear-gradient(135deg, #f5f5ff 0%, #ffffff 100%);
}

.type-rank {
  font-size: 0.85rem;
  color: #667eea;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.type-rank-badge {
  font-size: 0.9rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  padding: 0.3rem 0.8rem;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 20px;
  display: inline-block;
}

.rank-1 .type-rank-badge {
  background: rgba(255, 215, 0, 0.2);
  color: #b8860b;
}

.rank-2 .type-rank-badge {
  background: rgba(192, 192, 192, 0.2);
  color: #666;
}

.rank-3 .type-rank-badge {
  background: rgba(205, 127, 50, 0.2);
  color: #8b4513;
}

.type-name {
  font-size: 1.3rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.5rem;
}

.type-similarity {
  font-size: 1.2rem;
  color: #667eea;
  margin-bottom: 0.8rem;
  font-weight: bold;
}

.type-params-mini {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 0.8rem;
  flex-wrap: wrap;
}

.param-mini-item {
  font-size: 0.75rem;
  background: #f0f0f0;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  color: #666;
}

.type-description {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.type-match-bar {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.match-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.5s ease;
}

.result-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

/* ===== 按钮样式 ===== */
.btn-primary {
  padding: 0.8rem 2rem;
  border: none;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.8rem 2rem;
  border: 2px solid #667eea;
  background: white;
  color: #667eea;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.btn-secondary:hover:not(:disabled) {
  background: #f5f5ff;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== 动画 ===== */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== 响应式设计 ===== */
@media (max-width: 768px) {
  .header h1 {
    font-size: 1.8rem;
  }

  .types-container {
    grid-template-columns: 1fr;
  }

  .param-row {
    grid-template-columns: 80px 1fr 40px;
  }

  .navigation {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }

  .result-actions {
    flex-direction: column;
  }
}
</style>

