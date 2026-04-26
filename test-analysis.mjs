import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import path from 'path'
import { analyzeAnswers } from './src/utils/analysis.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const qPath = path.join(__dirname, 'src', 'data', 'questions.json')

async function run() {
  const raw = await fs.readFile(qPath, 'utf-8')
  const questions = JSON.parse(raw)

  const answers = {}
  // 选择每题第一个选项作为示例回答
  for (const q of questions) {
    answers[q.id] = q.options[0].id
  }

  const result = analyzeAnswers(answers, questions)
  console.log(JSON.stringify(result, null, 2))
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
