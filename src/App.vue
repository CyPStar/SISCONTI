<template>
  <div class="app-wrapper">
    <!-- 动态背景层 -->
    <div class="bg-layer">
      <div
        v-for="(bg, index) in bgImages"
        :key="index"
        class="bg-slide"
        :class="{ active: currentBgIndex === index }"
        :style="{ backgroundImage: `url(${bg})` }"
      ></div>
    </div>

    <!-- 内容层 -->
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
          <h2>欢迎来到 SISCONTI 测试</h2>
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

      <!-- 中间提示页面（第18题后） -->
      <section v-else-if="currentStep === 'warning'" class="warning-page">
        <div class="warning-box">
          <div class="warning-icon">⚠️</div>
          <h2>即将进入极端题目</h2>
          <p class="warning-text">
            接下来的题目将会极端一点，您可以选择跳过题目，直接得出结果。<br>
            也可以选择继续作答，得出更丰富的结果。
          </p>
          <p class="warning-note">⚠️ 所有情景仅针对二次元，与现实无关，请勿当真~</p>
          <div class="warning-buttons">
            <button @click="finishNow" class="btn-primary">
              就这样结束，得出结果
            </button>
            <button @click="continueTest" class="btn-continue">
              还想继续答题 →
            </button>
          </div>
          <button @click="goBack" class="btn-back">← 返回上一题</button>
        </div>
      </section>

      <!-- 结果页面 -->
      <section v-else-if="currentStep === 'result'" class="result-page">
        <div class="result-container" ref="resultContainer">
          <!-- 五维参数显示 -->
          <div class="params-section">
            <h2>你的五维参数（累加得分）</h2>
            <p class="avg-note">各维度累计得分</p>
            <div class="params-chart">
              <div class="param-row" v-for="(dim, index) in result.currentParams" :key="index">
                <span class="dim-label">{{ dim.name }}</span>
                <div class="param-bar">
                  <div class="param-fill" :style="{ width: dim.percentage + '%' }"></div>
                </div>
                <span class="dim-value">{{ dim.rawValue }} <span class="raw-value">分</span></span>
              </div>
            </div>
          </div>

          <!-- 主类型结果 -->
          <div class="main-type-section">
            <h2>🏆 你的妹控类型</h2>
            <div class="main-type-card" v-if="result.mainType">
              <div class="main-type-rank">🥇 主型</div>
              <div class="main-type-name">{{ result.mainType.name }}</div>
              <div class="main-type-score">{{ result.mainType.similarity }}% 匹配</div>
              <p class="type-description">{{ result.mainType.description }}</p>
              <!-- 五维雷达条 -->
              <div class="main-type-params">
                <div v-for="(val, idx) in result.mainType.params" :key="idx" class="main-param-item">
                  <span class="main-param-label">{{ ['爱', '控', '理', '幻', '专'][idx] }}</span>
                  <div class="main-param-bar">
                    <div class="main-param-fill" :style="{ width: val * 10 + '%' }"></div>
                  </div>
                  <span class="main-param-val">{{ val }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 副人格（副结果） -->
          <div class="sub-types-section">
            <h2>💫 副人格</h2>
            <p class="sub-types-note">你性格中潜在的其他倾向</p>
            <div class="sub-types-container">
              <div
                class="sub-type-card"
                v-for="(type, index) in result.topThreeTypes.slice(1)"
                :key="index"
                :class="{ 'rank-2': index === 0, 'rank-3': index === 1 }"
              >
                <div class="sub-type-rank-badge">
                  {{ index === 0 ? '🥈' : '🥉' }} 第{{ index + 2 }}位
                </div>
                <div class="sub-type-name">{{ type.name }}</div>
                <div class="sub-type-similarity">{{ type.similarity }}% 匹配</div>
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
  </div>
</template>

<script>
import questions from './data/questions.json'
import brotherTypes from './data/brotherTypes.json'
import { analyzeAnswers, getVisualizationData } from './utils/analysis'
import domtoimage from 'dom-to-image-more'

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
      currentStep: 'start', // start, testing, warning, result
      currentQuestionIndex: 0,
      questions: [],
      answers: {}, // { questionId: optionId }
      selectedAnswer: null,
      result: null,
      brotherTypes: [],
      warningShown: false, // 是否已显示过警告页面
      // 动态背景
      bgImages: [
        new URL('./assets/ysf.png', import.meta.url).href,
        new URL('./assets/ysf2.png', import.meta.url).href,
        new URL('./assets/ysf3.png', import.meta.url).href,
        new URL('./assets/ysf4.png', import.meta.url).href,
        new URL('./assets/ysf5.png', import.meta.url).href
      ],
      currentBgIndex: 0,
      bgTimer: null
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
    startBgSlideshow() {
      this.bgTimer = setInterval(() => {
        this.currentBgIndex = (this.currentBgIndex + 1) % this.bgImages.length
      }, 5000)
    },
    stopBgSlideshow() {
      if (this.bgTimer) {
        clearInterval(this.bgTimer)
        this.bgTimer = null
      }
    },
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
      // 第18题后显示警告页面（只显示一次）
      if (this.currentQuestionIndex === 17 && !this.warningShown) {
        this.warningShown = true
        this.currentStep = 'warning'
        return
      }
      
      if (this.currentQuestionIndex < this.totalQuestions - 1) {
        this.currentQuestionIndex++
        this.loadQuestion()
      } else {
        this.submitTest()
      }
    },
    previousQuestion() {
      // 如果在警告页面，返回到第18题
      if (this.currentStep === 'warning') {
        this.currentQuestionIndex = 17
        this.loadQuestion()
        this.currentStep = 'testing'
        return
      }
      
      if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--
        this.loadQuestion()
      }
    },
    // 显示中间结果
    finishNow() {
      this.submitTest()
    },
    // 继续答题
    continueTest() {
      this.currentStep = 'testing'
      this.currentQuestionIndex = 18
      this.loadQuestion()
    },
    // 返回上一题
    goBack() {
      this.currentQuestionIndex = 17
      this.loadQuestion()
      this.currentStep = 'testing'
    },
    submitTest() {
      // 分析答题结果
      const analysisResult = analyzeAnswers(this.answers, this.questions)
      
      // 获取参数可视化数据
      const currentParams = getVisualizationData(analysisResult.params, analysisResult.topThreeTypes)
      
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
      this.warningShown = false
    },
    async exportResult() {
      if (!this.result || !this.$refs.resultContainer) return

      const el = this.$refs.resultContainer
      const originalBg = el.style.background
      try {
        // 临时设为实心底色，截图后恢复
        el.style.background = '#fffceb'
        const dataUrl = await domtoimage.toPng(el, {
          quality: 1,
          width: el.scrollWidth * 2,
          height: el.scrollHeight * 2,
          style: {
            transform: 'scale(2)',
            transformOrigin: 'top left'
          }
        })
        const link = document.createElement('a')
        link.download = '我的妹控测试结果.png'
        link.href = dataUrl
        link.click()
      } catch (e) {
        console.error('截图失败:', e)
      } finally {
        el.style.background = originalBg
      }
    }
  },
  mounted() {
    this.questions = questions
    this.brotherTypes = brotherTypes
    this.startBgSlideshow()
  },
  beforeUnmount() {
    this.stopBgSlideshow()
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* ===== 最外层包装 ===== */
.app-wrapper {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
}

/* ===== 动态背景层（底层，不阻挡交互）===== */
.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.bg-slide {
  position: absolute;
  top: -10%;
  left: -10%;
  width: 120%;
  height: 120%;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transition: opacity 4s ease-in-out;
  animation: bgDrift 20s ease-in-out infinite alternate;
  will-change: transform;
  pointer-events: none;
}

.bg-slide.active {
  opacity: 1;
}

@keyframes bgDrift {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(-3%, -2%) scale(1.05); }
}

/* ===== 内容层（在背景之上，可交互）===== */
.sisconti-container {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgba(255, 253, 230, 0.75);
}

.header {
  background: rgba(255, 248, 220, 0.95);
  color: #000;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(139, 105, 20, 0.15);
  border-bottom: 2px solid #D4A017;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #000;
}

.subtitle {
  font-size: 1.1rem;
  color: #333;
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
  background: rgba(255, 252, 235, 0.95);
  padding: 3rem 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(139, 105, 20, 0.15);
  text-align: center;
  animation: slideUp 0.5s ease-out;
  border: 1px solid rgba(212, 160, 23, 0.3);
}

.welcome-box h2 {
  color: #000;
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

.test-count {
  color: #8B6914;
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.description {
  color: #555;
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
  height: 8px;
  background: rgba(139, 105, 20, 0.15);
  border-radius: 4px;
  overflow: hidden;
  margin-right: 0.8rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #D4A017, #C9A86C);
  transition: width 0.3s ease;
}

.progress-text {
  color: #333;
  text-align: right;
  font-size: 0.9rem;
}

.question-card {
  background: rgba(255, 252, 235, 0.95);
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(139, 105, 20, 0.12);
  animation: slideUp 0.5s ease-out;
  border: 1px solid rgba(212, 160, 23, 0.2);
}

.question-title {
  color: #000;
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
  flex-direction: row;
  align-items: center;
  padding: 1.2rem;
  border: 2px solid rgba(212, 160, 23, 0.25);
  background: rgba(255, 255, 250, 0.9);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  font-size: 1rem;
}

.option-btn:hover {
  border-color: #D4A017;
  background: rgba(255, 248, 220, 0.9);
}

.option-btn.selected {
  border-color: #D4A017;
  background: rgba(255, 245, 180, 0.7);
  box-shadow: 0 4px 12px rgba(212, 160, 23, 0.25);
}

.option-label {
  display: inline-block;
  background: #D4A017;
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: bold;
  margin-right: 0.8rem;
}

.option-text {
  color: #000;
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
  background: rgba(255, 252, 235, 0.95);
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(139, 105, 20, 0.12);
  border: 1px solid rgba(212, 160, 23, 0.2);
  padding: 2.5rem;
  animation: slideUp 0.5s ease-out;
}

/* 参数部分 */
.params-section h2,
.types-section h2 {
  color: #000;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #D4A017;
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
  color: #000;
}

.param-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.param-fill {
  height: 100%;
  background: linear-gradient(90deg, #D4A017, #C9A86C);
  transition: width 0.3s ease;
}

.dim-value {
  text-align: right;
  color: #8B6914;
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
  margin-right: 0.8rem;
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
  color: #000;
  margin-right: 0.8rem;
}

.type-similarity {
  font-size: 1.2rem;
  color: #8B6914;
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
  background: linear-gradient(90deg, #D4A017, #C9A86C);
  transition: width 0.5s ease;
}

/* ===== 主类型结果 ===== */
.main-type-section {
  margin-top: 2rem;
}

.main-type-section h2 {
  color: #8B6914;
  font-size: 1.6rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.main-type-card {
  background: linear-gradient(135deg, #fffef0, #fffbf0);
  border: 3px solid #D4A017;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 8px 30px rgba(212, 160, 23, 0.3);
  animation: glowPulse 3s ease-in-out infinite alternate;
}

@keyframes glowPulse {
  from { box-shadow: 0 8px 30px rgba(212, 160, 23, 0.25); }
  to { box-shadow: 0 12px 40px rgba(212, 160, 23, 0.45); }
}

.main-type-rank {
  font-size: 1.1rem;
  color: #b8860b;
  font-weight: bold;
  margin-right: 0.8rem;
}

.main-type-name {
  font-size: 1.8rem;
  font-weight: bold;
  color: #8B6914;
  margin-right: 0.8rem;
}

.main-type-score {
  font-size: 1.4rem;
  color: #D4A017;
  font-weight: bold;
  margin-bottom: 1rem;
}

.main-type-params {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 1rem;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.main-param-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.main-param-label {
  width: 28px;
  font-size: 0.85rem;
  font-weight: bold;
  color: #8B6914;
}

.main-param-bar {
  flex: 1;
  height: 10px;
  background: rgba(139, 105, 20, 0.15);
  border-radius: 5px;
  overflow: hidden;
}

.main-param-fill {
  height: 100%;
  background: linear-gradient(90deg, #D4A017, #C9A86C);
  border-radius: 5px;
  transition: width 0.6s ease;
}

.main-param-val {
  width: 24px;
  font-size: 0.85rem;
  font-weight: bold;
  color: #8B6914;
  text-align: right;
}

/* ===== 副人格区域 ===== */
.sub-types-section {
  margin-top: 2.5rem;
}

.sub-types-section h2 {
  color: #000;
  font-size: 1.4rem;
  margin-bottom: 0.3rem;
}

.sub-types-note {
  color: #888;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  text-align: center;
}

.sub-types-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.sub-type-card {
  background: linear-gradient(135deg, #f8f8ff, #ffffff);
  border: 2px solid #ddd;
  border-radius: 12px;
  padding: 1.2rem;
  transition: all 0.3s ease;
  text-align: center;
}

.sub-type-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(102, 126, 23, 0.15);
}

.sub-type-card.rank-2 {
  border-color: #c0c0c0;
}

.sub-type-card.rank-3 {
  border-color: #cd7f32;
}

.sub-type-rank-badge {
  font-size: 0.85rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  padding: 0.2rem 0.7rem;
  background: rgba(150, 150, 150, 0.1);
  border-radius: 20px;
  display: inline-block;
}

.sub-type-name {
  font-size: 1.1rem;
  font-weight: bold;
  color: #000;
  margin-bottom: 0.3rem;
}

.sub-type-similarity {
  font-size: 1rem;
  color: #8B6914;
  margin-bottom: 0.6rem;
  font-weight: bold;
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
  background: linear-gradient(135deg, #D4A017, #C9A86C);
  color: #000;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(212, 160, 23, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.8rem 2rem;
  border: 2px solid #D4A017;
  background: white;
  color: #8B6914;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 248, 220, 0.9);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== 警告页面 ===== */
.warning-page {
  width: 100%;
  max-width: 600px;
}

.warning-box {
  background: rgba(255, 252, 235, 0.95);
  padding: 3rem 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(139, 105, 20, 0.12);
  border: 1px solid rgba(212, 160, 23, 0.2);
  text-align: center;
  animation: slideUp 0.5s ease-out;
}

.warning-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.warning-box h2 {
  color: #000;
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
}

.warning-text {
  color: #666;
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 1.5rem;
}

.warning-note {
  color: #ff6b6b;
  font-size: 0.9rem;
  margin-bottom: 2rem;
  padding: 0.8rem;
  background: #fff5f5;
  border-radius: 8px;
}

.warning-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.btn-continue {
  padding: 0.8rem 2rem;
  border: 2px solid #4ade80;
  background: white;
  color: #4ade80;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-continue:hover {
  background: #f0fff0;
  transform: translateY(-2px);
}

.btn-back {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: #999;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-back:hover {
  color: #667eea;
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

  .sub-types-container {
    grid-template-columns: 1fr;
  }

  .main-type-name {
    font-size: 1.4rem;
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

