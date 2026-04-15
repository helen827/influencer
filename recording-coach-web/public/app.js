const topicEl = document.getElementById('topic')
const btnGenerate = document.getElementById('btnGenerate')
const statusEl = document.getElementById('status')
const panelTopic = document.getElementById('panelTopic')
const panelLive = document.getElementById('panelLive')
const tabTopic = document.getElementById('tabTopic')
const tabLive = document.getElementById('tabLive')
const stageEl = document.getElementById('stage')
const counterEl = document.getElementById('counter')
const questionEl = document.getElementById('question')
const btnPrev = document.getElementById('btnPrev')
const btnNext = document.getElementById('btnNext')
const btnBack = document.getElementById('btnBack')

const liveTopicHint = document.getElementById('liveTopicHint')
const btnLiveStart = document.getElementById('btnLiveStart')
const btnLiveStop = document.getElementById('btnLiveStop')
const liveStatusEl = document.getElementById('liveStatus')
const liveAutoEl = document.getElementById('liveAuto')
const btnLiveRefresh = document.getElementById('btnLiveRefresh')
const liveTranscriptEl = document.getElementById('liveTranscript')

/** @type {'topic' | 'live'} */
let activeTab = 'topic'
/** @type {'topic' | 'live'} */
let questionMode = 'topic'

/** @type {string[]} */
let questions = []
let index = 0

const TARGET_SR = 16000

/** @type {WebSocket | null} */
let asrWs = null
/** @type {AudioContext | null} */
let audioCtx = null
/** @type {ScriptProcessorNode | null} */
let audioProcessor = null
/** @type {MediaStream | null} */
let mediaStream = null
/** @type {GainNode | null} */
let muteNode = null
/** @type {MediaStreamAudioSourceNode | null} */
let mediaSource = null

let liveTranscript = ''
let autoRefreshTimer = null
let lastFetchedSnippet = ''

function setStatus(text, isError = false) {
  statusEl.textContent = text
  statusEl.classList.toggle('error', isError)
}

function setLiveStatus(text, isError = false) {
  liveStatusEl.textContent = text
  liveStatusEl.classList.toggle('error', isError)
}

function showStage() {
  stageEl.classList.remove('hidden')
}

function hideStage() {
  stageEl.classList.add('hidden')
}

function selectTab(tab) {
  if (tab === 'topic' && activeTab === 'live') {
    void stopLive()
  }
  activeTab = tab
  const isTopic = tab === 'topic'
  tabTopic.classList.toggle('active', isTopic)
  tabLive.classList.toggle('active', !isTopic)
  tabTopic.setAttribute('aria-selected', String(isTopic))
  tabLive.setAttribute('aria-selected', String(!isTopic))
  panelTopic.classList.toggle('hidden', !isTopic)
  panelLive.classList.toggle('hidden', isTopic)
}

function renderQuestion() {
  if (questions.length === 0) return
  index = Math.max(0, Math.min(index, questions.length - 1))
  const prefix = questionMode === 'live' ? '实时 · ' : ''
  counterEl.textContent = `${prefix}第 ${index + 1} / 共 ${questions.length} 条`
  questionEl.textContent = questions[index]
}

function downsampleBuffer(buffer, inputSampleRate, outputSampleRate) {
  if (inputSampleRate === outputSampleRate) return buffer
  const ratio = inputSampleRate / outputSampleRate
  const length = Math.round(buffer.length / ratio)
  const result = new Float32Array(length)
  let offsetResult = 0
  let offsetBuffer = 0
  while (offsetResult < length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio)
    let accum = 0
    let count = 0
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i]
      count++
    }
    result[offsetResult] = count > 0 ? accum / count : 0
    offsetResult++
    offsetBuffer = nextOffsetBuffer
  }
  return result
}

function floatTo16BitPCM(input) {
  const output = new Int16Array(input.length)
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]))
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return output.buffer
}

function wsUrl() {
  const p = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${p}//${location.host}/ws/asr`
}

function clearAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
}

function startAutoRefresh() {
  clearAutoRefresh()
  if (!liveAutoEl.checked) return
  autoRefreshTimer = window.setInterval(() => {
    if (!asrWs || asrWs.readyState !== WebSocket.OPEN) return
    if (liveTranscript.length < 20) return
    if (liveTranscript === lastFetchedSnippet) return
    void fetchLiveQuestions(false)
  }, 20_000)
}

async function fetchLiveQuestions(showBusy) {
  if (liveTranscript.length < 15) {
    setLiveStatus('多说几句后再生成问题（至少约 15 字）。', true)
    return
  }
  const topic = liveTopicHint.value.trim()
  if (showBusy) setLiveStatus('正在根据转录生成问题…')
  try {
    const res = await fetch('/api/live-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: liveTranscript, topic: topic || undefined })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setLiveStatus(data.error || `请求失败（${res.status}）`, true)
      return
    }
    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      setLiveStatus('未收到有效问题。', true)
      return
    }
    questions = data.questions
    index = 0
    questionMode = 'live'
    lastFetchedSnippet = liveTranscript
    setLiveStatus('已更新问题列表。')
    showStage()
    renderQuestion()
  } catch {
    setLiveStatus('网络错误。', true)
  }
}

function teardownAudio() {
  disconnectAudioGraphOnly()
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop())
    mediaStream = null
  }
}

function disconnectAudioGraphOnly() {
  try {
    audioProcessor?.disconnect()
  } catch {
    void 0
  }
  try {
    mediaSource?.disconnect()
  } catch {
    void 0
  }
  try {
    muteNode?.disconnect()
  } catch {
    void 0
  }
  audioProcessor = null
  mediaSource = null
  muteNode = null
  if (audioCtx && audioCtx.state !== 'closed') {
    void audioCtx.close()
  }
  audioCtx = null
}

async function startAudioGraph() {
  if (!mediaStream?.active || !asrWs || asrWs.readyState !== WebSocket.OPEN) return
  disconnectAudioGraphOnly()
  audioCtx = new AudioContext()
  mediaSource = audioCtx.createMediaStreamSource(mediaStream)
  const bufferSize = 4096
  audioProcessor = audioCtx.createScriptProcessor(bufferSize, 1, 1)
  muteNode = audioCtx.createGain()
  muteNode.gain.value = 0

  audioProcessor.onaudioprocess = (e) => {
    if (!asrWs || asrWs.readyState !== WebSocket.OPEN) return
    const input = e.inputBuffer.getChannelData(0)
    const down = downsampleBuffer(input, audioCtx.sampleRate, TARGET_SR)
    const pcm = floatTo16BitPCM(down)
    asrWs.send(pcm)
  }

  mediaSource.connect(audioProcessor)
  audioProcessor.connect(muteNode)
  muteNode.connect(audioCtx.destination)
  await audioCtx.resume()
}

async function stopLive() {
  clearAutoRefresh()
  teardownAudio()
  if (asrWs && asrWs.readyState === WebSocket.OPEN) {
    try {
      asrWs.send(JSON.stringify({ type: 'stop' }))
    } catch {
      void 0
    }
  }
  asrWs?.close()
  asrWs = null
  btnLiveStart.disabled = false
  btnLiveStop.disabled = true
  setLiveStatus('已停止。')
}

async function startLive() {
  if (asrWs && asrWs.readyState === WebSocket.OPEN) return
  setLiveStatus('请求麦克风…')
  btnLiveStart.disabled = true
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true
      }
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    setLiveStatus('无法访问麦克风：' + msg, true)
    btnLiveStart.disabled = false
    return
  }

  liveTranscript = ''
  liveTranscriptEl.textContent = ''
  lastFetchedSnippet = ''

  const ws = new WebSocket(wsUrl())
  asrWs = ws
  ws.binaryType = 'arraybuffer'

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'start' }))
    setLiveStatus('连接识别服务…')
  }

  ws.onmessage = async (ev) => {
    if (ev.data instanceof ArrayBuffer) return
    let msg
    try {
      msg = JSON.parse(ev.data)
    } catch {
      return
    }
    if (msg.type === 'asr_ready') {
      try {
        await startAudioGraph()
        setLiveStatus('正在听，可直接对着麦克风讲…')
        btnLiveStop.disabled = false
        startAutoRefresh()
      } catch (e) {
        const m = e instanceof Error ? e.message : String(e)
        setLiveStatus('音频初始化失败：' + m, true)
        void stopLive()
      }
      return
    }
    if (msg.type === 'transcript') {
      liveTranscript = msg.text || ''
      liveTranscriptEl.textContent = liveTranscript
      return
    }
    if (msg.type === 'error') {
      setLiveStatus(msg.message || '错误', true)
      return
    }
    if (msg.type === 'asr_error') {
      setLiveStatus(msg.message || '识别连接异常', true)
      return
    }
    if (msg.type === 'asr_stopped') {
      setLiveStatus('识别已停止。')
    }
  }

  ws.onerror = () => {
    setLiveStatus('WebSocket 错误。', true)
  }

  ws.onclose = () => {
    clearAutoRefresh()
    teardownAudio()
    asrWs = null
    btnLiveStart.disabled = false
    btnLiveStop.disabled = true
  }
}

tabTopic.addEventListener('click', () => selectTab('topic'))
tabLive.addEventListener('click', () => selectTab('live'))
btnLiveStart.addEventListener('click', () => void startLive())
btnLiveStop.addEventListener('click', () => void stopLive())
btnLiveRefresh.addEventListener('click', () => void fetchLiveQuestions(true))

async function generate() {
  const topic = topicEl.value.trim()
  if (!topic) {
    setStatus('请先写一句本期主题。', true)
    return
  }
  setStatus('生成中…')
  btnGenerate.disabled = true
  try {
    const res = await fetch('/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setStatus(data.error || `请求失败（${res.status}）`, true)
      return
    }
    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      setStatus('未收到有效问题列表。', true)
      return
    }
    questions = data.questions
    index = 0
    questionMode = 'topic'
    setStatus('')
    showStage()
    renderQuestion()
  } catch {
    setStatus('网络错误，请确认服务已启动。', true)
  } finally {
    btnGenerate.disabled = false
  }
}

function next() {
  if (questions.length === 0) return
  index = (index + 1) % questions.length
  renderQuestion()
}

function prev() {
  if (questions.length === 0) return
  index = (index - 1 + questions.length) % questions.length
  renderQuestion()
}

btnGenerate.addEventListener('click', () => void generate())
btnNext.addEventListener('click', next)
btnPrev.addEventListener('click', prev)
btnBack.addEventListener('click', () => {
  hideStage()
  questions = []
  index = 0
})

liveAutoEl.addEventListener('change', () => {
  if (asrWs?.readyState === WebSocket.OPEN) startAutoRefresh()
})

document.addEventListener('keydown', (e) => {
  if (stageEl.classList.contains('hidden')) {
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault()
      void document.documentElement.requestFullscreen?.()
    }
    return
  }
  if (e.key === ' ' || e.code === 'Space') {
    e.preventDefault()
    if (e.shiftKey) prev()
    else next()
    return
  }
  if (e.key === 'f' || e.key === 'F') {
    e.preventDefault()
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen?.()
  }
})
