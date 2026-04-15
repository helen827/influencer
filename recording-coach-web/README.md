# 录视频引导提问（浏览器 + LLM）

本地运行的轻量网页：可**按主题**预生成一串口语化追问，也可**实时听麦克风**，把识别到的内容送给大模型，持续生成贴合你正在讲的内容的追问。

## 准备

1. 复制环境变量模板：

   ```bash
   cp .env.example .env
   ```

2. 在 `.env` 中至少配置一种 LLM（按优先级只生效一种）：

   - **七牛**：`QINIU_AI_API_KEY`（可选 `QINIU_LLM_MODEL`，默认 `deepseek-v3`），与 MeetingPilot 相同渠道。
   - **Cursor / OpenAI 兼容（专用变量名）**：同时设置 `CURSOR_API_KEY` 与 `CURSOR_API_BASE_URL`（文档里的推理地址，通常以 `/v1` 结尾）；可选 `CURSOR_LLM_MODEL`。适用于你在 Cursor 或其它平台拿到的 Key + Base URL 组合。
   - **OpenAI 或其它兼容**：`OPENAI_API_KEY`，可选 `OPENAI_BASE_URL`、`OPENAI_MODEL`。

   说明：Cursor 编辑器 **Settings → Models** 里填的往往是 **OpenAI / Anthropic 等厂商的 Key**，给编辑器用；本工具是独立 Node 服务，需要 **HTTP 可调用的 OpenAI 兼容端点**。若官方只提供 Key 与 Base URL，请用 `CURSOR_*` 或 `OPENAI_*` 成对填写，勿把 Key 写进前端页面。

3. **联网搜索（可选，默认开启）**  
   生成问题前会按「主题」或「主题 + 当前转录」发起 1～2 次搜索，把摘要交给模型，让追问更具体。  
   - 默认 `SEARCH_PROVIDER=duckduckgo`（无需额外 Key，与本机网络有关）。  
   - 需要更稳定可设 `SEARCH_PROVIDER=serper` 并配置 `SERPER_API_KEY`（与 MeetingPilot 相同）。  
   - 完全不要联网：在 `.env` 中设置 `RECORDING_COACH_WEB_SEARCH=0`。

4. 安装依赖并启动：

   ```bash
   npm install
   npm run dev
   ```

5. 浏览器打开终端里打印的地址（默认 `http://127.0.0.1:3847`）。

## 使用

### 按主题生成

1. 切到 **按主题生成**，在「本期主题」里写一句话或一小段说明。
2. 点击 **生成问题**，进入大字号展示。
3. **空格** / **Shift+空格** 切换上一条、下一条；**F** 全屏；**Esc** 退出全屏；**返回**回到输入区。

### 实时听我说

1. 切到 **实时听我说**。实时语音识别走 **七牛**，请确认 `.env` 已配置 `QINIU_AI_API_KEY`（`sk-` 开头，与 MeetingPilot 相同）。
2. 可选填写「整期主题提示」，帮助模型理解背景。
3. 点击 **开始听**，允许浏览器使用麦克风；连接成功后即可对着麦克风说话，页面会显示**实时转录**。
4. 点击 **立即根据转录更新问题**，或勾选 **约每 20 秒自动更新**；生成的问题同样用大字号展示，可用空格切换。
5. **停止** 会结束麦克风和识别连接。切换到 **按主题生成** 标签时也会自动停止实时听写。

追问生成使用与上文相同的 LLM 配置（七牛 / OpenAI 兼容等）；仅 **听写** 必须能访问七牛实时 ASR。

## OBS 浏览器源

1. 先在本机运行 `npm run dev`（或 `npm run build && npm run start`）。
2. 在 OBS 中添加「浏览器」源，URL 填 `http://127.0.0.1:3847`（若改了 `PORT`，用对应端口）。
3. 建议宽度与画布一致或放在副屏；在网页里生成问题后再开始录制，录制过程中用键盘切换需在 OBS 聚焦浏览器源或使用副屏浏览器。

## 生产启动

```bash
npm run build
npm run start
```

## 部署上线（网站）

这是一个 **Node 服务**（HTTP + `/ws/asr` WebSocket），需要长期运行的容器或虚拟机，**不能**像纯静态页那样只丢到 GitHub Pages。

### 上线前注意

1. **密钥**：在云平台「环境变量 / Secrets」里配置 `QINIU_AI_API_KEY` 等，**不要**把 `.env` 提交到 Git 仓库。  
2. **HTTPS**：公网访问时浏览器才会稳定允许麦克风；Railway、Render、Fly.io 等一般会自带 HTTPS。  
3. **端口**：平台若注入 `PORT`，服务会自动监听该端口（见 `server.ts`）。  
4. **联网搜索**：云上若 DuckDuckGo 不稳定，可改用 `SEARCH_PROVIDER=serper` + `SERPER_API_KEY`。

### 方式一：Docker（通用）

在项目根目录：

```bash
docker build -t recording-coach-web .
docker run --rm -p 3847:3847 \
  -e QINIU_AI_API_KEY="你的key" \
  -e QINIU_LLM_MODEL=deepseek-v3 \
  recording-coach-web
```

浏览器访问 `http://localhost:3847`。正式环境把镜像推到 **Fly.io、Railway、阿里云容器、自建 VPS** 等，并在控制台配置同样的环境变量。

### 方式二：平台直接跑 Node（无 Docker）

在仓库根目录配置：

- **Build**：`npm install && npm run build`  
- **Start**：`npm start`  
- **Root directory**：`recording-coach-web`（若仓库是 monorepo，把该目录设为应用根）

将 `QINIU_AI_API_KEY` 等写入平台环境变量即可。

### 与本机开发的区别

- 默认监听 **`0.0.0.0`**（便于云上接受流量）；若只想本机访问，可在 `.env` 设 `LISTEN_HOST=127.0.0.1`。

### 方式三：Render（推荐按下面做）

本项目根目录已包含 [`render.yaml`](render.yaml)，适合 **单独一个 Git 仓库只装本应用** 时使用（在 Render 选 **Blueprint** 连接仓库即可自动生成服务）。

#### A. 仓库就是 `recording-coach-web` 这一层

1. 把代码推到 GitHub（仓库根目录里要有 `package.json`、`render.yaml`）。  
2. 打开 [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**。  
3. 连接该仓库 → Render 会读取 `render.yaml` 创建 **Web Service**。  
4. 部署完成后进入该服务 → **Environment** → **Add Environment Variable**，至少添加：  
   - `QINIU_AI_API_KEY`（以及你本地 `.env` 里用到的其它变量，如 `QINIU_LLM_MODEL`、`SERPER_API_KEY` 等）。  
5. **Manual Deploy** 一次或推送新 commit，让实例带上新环境变量。  
6. 打开 Render 给出的 `https://xxx.onrender.com` 即可访问（自带 HTTPS，麦克风可用）。

#### B. 仓库是更大的 monorepo（本应用在子目录里）

不要用仓库根的 `render.yaml` 指向子目录（Blueprint 对子目录支持有限）。请改用 **手动建 Web Service**：

1. **New** → **Web Service** → 连接仓库。  
2. **Root Directory** 填：`recording-coach-web`（按你实际路径改）。  
3. **Runtime**：Node  
4. **Build Command**：`npm install && npm run build`  
5. **Start Command**：`npm start`  
6. 同样在 **Environment** 里配置 `QINIU_AI_API_KEY` 等。

#### Render 上常见说明

- **端口**：不要手写固定端口；Render 会注入 `PORT`，本服务已自动读取。  
- **免费实例**：一段时间无人访问会休眠，首次打开可能多等几十秒。  
- **区域**：`render.yaml` 里默认 `region: singapore`，可在文件里改成 `oregon` / `frankfurt` 等后再部署。  
- **WebSocket**：与网页同域，一般无需额外配置；若遇断线，多为休眠唤醒后刷新页面即可。

## 项目结构

- `src/server.ts`：HTTP 服务、静态资源、`/ws/asr` WebSocket 升级。
- `src/promptsApi.ts`：`POST /api/prompts`（按主题 + 可选联网摘要）。
- `src/liveQuestionsApi.ts`：`POST /api/live-questions`（转录 + 主题 + 可选联网摘要）。
- `src/webSearch.ts`、`src/duckDuckGo.ts`：DuckDuckGo / Serper 检索。
- `src/recordingSearchQueries.ts`：由主题/转录拼搜索关键词。
- `src/qiniuAiAsr.ts` / `src/asrWebSocket.ts`：浏览器 PCM → 七牛流式 ASR。
- `src/llmConfig.ts`、`src/parseQuestionsJson.ts`：共享 LLM 与 JSON 解析。
- `public/`：单页 HTML / CSS / JS。
- `Dockerfile`、`.dockerignore`：容器镜像构建。
- `render.yaml`：Render Blueprint（Web Service + 健康检查路径）。
