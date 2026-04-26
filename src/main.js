import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

const app = createApp(App)

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err)
  console.error('Info:', info)
}

window.addEventListener('error', (e) => {
  console.error('Global Error:', e.error)
})

app.mount('#app')
