# ⚡ OllamaVisual

<div align="center">

![OllamaVisual Banner](https://img.shields.io/badge/OllamaVisual-Studio%20%26%20Dashboard-06b6d4?style=for-the-badge&logo=cpu&logoColor=white)

**A high-performance, glassmorphic visual dashboard, interactive playground, and model creation studio for local Ollama models.**

[![Node.js Version](https://img.shields.io/badge/Node.js-18.0%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Ollama Compatible](https://img.shields.io/badge/Ollama-Native%20API-white?style=flat-square&logo=ollama&logoColor=black)](https://ollama.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/ShaharZohar/OllamaVisual/pulls)

[Overview](#-overview) •
[Key Features](#-key-features) •
[Architecture](#-architecture) •
[Quick Start](#-quick-start) •
[Configuration](#-configuration) •
[Feature Tour](#-feature-tour) •
[API Reference](#-api-endpoints) •
[Project Structure](#-project-structure)

</div>

---

## 🌟 Overview

**OllamaVisual** is an all-in-one web interface and developer studio designed to unlock the full potential of your local large language models running on [Ollama](https://ollama.com).

While Ollama makes pulling and serving open weights effortless from the command line, modern AI workflows demand rich interactions: streaming reasoning tokens, inspecting layer tensors, testing multimodal vision inputs, managing personas, benchmarking models side-by-side, tuning context windows, and forging custom Modelfiles.

OllamaVisual wraps Ollama's native API in an ultra-responsive, zero-build vanilla stack featuring a sleek dark-mode glassmorphic interface, real-time telemetry, and small-model training experimentation.

---

## ✨ Key Features

### 💬 1. Interactive Chat Studio
* **Real-time Streaming:** Smooth, low-latency token streaming via native ndjson proxying.
* **Live Telemetry & Metrics:** Real-time generation speed (**tokens/sec**), token counter, **Time-to-First-Token (TTFT)** in milliseconds, and total elapsed generation duration.
* **Deep Thinking Token Support:** Automatically parses and styles `<think>...</think>` reasoning chains with custom badges and folding (optimized for DeepSeek-R1, Gemma 4, QwQ, etc.).
* **Rich Markdown & Syntax Highlighting:** Full Markdown formatting, tables, lists, and syntax-highlighted code blocks powered by [Marked.js](https://marked.js.org/) and [Highlight.js](https://highlightjs.org/) (`atom-one-dark`).
* **One-Click Code Copy:** Dedicated copy buttons for every generated code block.
* **Chat Export & History:** One-click JSON conversation export and instant clear controls.
* **Abort Generation:** Instantly halt streaming generation via `AbortController`.

### 👁️ 2. Multimodal Vision Studio
* **Drag-and-Drop / Clipboard Paste:** Paste screenshots directly from clipboard (`⌘V` / `Ctrl+V`) or drag and drop image files into the prompt area.
* **Multi-Image Support:** Attach multiple images per prompt with thumbnail preview trays and removal chips.
* **Native Base64 Ingestion:** Automatically transforms images to Ollama-compliant base64 payloads for vision models (e.g., `llava`, `llama3.2-vision`, `bakllava`).

### 🎭 3. Custom Persona Manager
* **Built-in Personas:** Instant access to curated AI roles:
  * 🐍 **Python Master** — PEP8, async patterns, type hints, modern 3.11+ syntax.
  * ✍️ **Creative Wordsmith** — High-end copywriting, narrative storytelling, marketing.
  * ☁️ **Senior DevOps Architect** — Kubernetes, Terraform, Docker, CI/CD.
  * 🧠 **Deep Reasoner** — Step-by-step logic deduction and first-principles reasoning.
  * ⚡ **Concise Assistant** — Zero-fluff, minimalist answers with maximum accuracy.
  * 💻 **Full-Stack Architect** — TypeScript, React, Node.js, and API design.
* **Persona Creation Modal:** Design and persist custom personas with custom emoji avatars, descriptions, and system prompts (stored in browser `localStorage`).

### 📚 4. Prompt Templates Library
* **Curated Presets:** Ready-to-run prompt templates across categories: **Coding**, **Database**, **Writing**, **Regex**, and **Custom**.
* **Variable Placeholders:** Templates support `{{input}}` token replacement—insert templates straight into your chat input with pre-focused cursors.
* **Custom Template Creator:** Build, categorize, search, filter, and save your own reusable prompt macros.

### 🎛️ 5. Hyperparameter Tuning Drawer
* **Context Window (`num_ctx`):** Freely select context buffer sizes from **2,048 (2K)** up to **65,536 (64K)** tokens.
* **Inference Parameters:** Interactive sliders for:
  * **Temperature** ($0.0 \to 2.0$)
  * **Top-P** ($0.0 \to 1.0$)
  * **Top-K** ($1 \to 100$)
  * **Max Tokens (`num_predict`)** ($128 \to 8,192$)
  * **Repeat Penalty** ($1.0 \to 2.0$)
* **System Prompt Override:** Fine-tune model behavior on the fly without restarting sessions.

### ⚔️ 6. Side-by-Side Model Arena
* **Simultaneous Model Duels:** Run identical prompts across two different models concurrently (e.g., `gemma4:31b` vs `llama3.2:3b`).
* **Comparative Throughput:** Live side-by-side stats comparing tokens/sec, total token generation, and response latencies.
* **Dual Output Rendering:** Synchronized Markdown streams to evaluate reasoning quality, coding accuracy, and verbosity.

### 📦 7. Models Library & Deep Inspector
* **Live Model Grid:** Visual cards for all installed models showing family, parameter size, quantization level, file size, and digest.
* **Filter Chips:** Quickly filter models by **All**, **🔥 Loaded in VRAM**, **💡 Thinking**, **⚡ 30B+ Large**, and **🛠️ Tool Calling**.
* **Model Puller:** In-app GUI to pull any model tag from the Ollama library with a real-time progress bar, percentage, and layer download status.
* **Deep Model Inspector Modal (`/api/show`):**
  * 📄 **Modelfile:** Full original dockerfile-style configuration.
  * ⚙️ **Parameters:** Quantization stops, context limits, and default sampling values.
  * 💬 **Template:** Raw prompt formatting string.
  * 🔬 **Tensors & Architecture:** Layer-by-layer tensor breakdown, weight blocks, and architecture metadata.
  * 📜 **License:** Model distribution license.
* **Model Management:** Delete models or free up GPU memory with a single click.

### 🔬 8. Model Sandbox & Training Lab
* 🔨 **Model Forge (`/api/create`):**
  * Visual Modelfile builder with live syntax-highlighted code output.
  * Architecture presets: *Code Specialist*, *Step-by-Step Reasoner*, *Zero-Fluff Minimal*, and *Raw Custom*.
  * Compile and package custom models directly into Ollama with live streaming build terminal output.
* 🗄️ **Dataset Studio:**
  * Create and maintain fine-tuning datasets in standard Alpaca JSON format.
  * **Synthetic Data Distillation:** Use high-parameter teacher models (such as `gemma4:31b`) to autonomously synthesize instruction-output training pairs for smaller models.
  * Import, edit, and export datasets to JSON / JSONL.
* ⚡ **LoRA Training Lab:**
  * Configure training runs (Epochs, Batch Size, Learning Rate, and LoRA Rank $r=4, 8, 16$).
  * Simulated training coordinator with a **live HTML5 Canvas loss descent curve** and real-time step logs.
* 🧠 **Neural Playground (In-Browser Micro-Transformer):**
  * Educational 2-head, 64-dimensional micro-transformer running client-side.
  * Real-time backpropagation stepping across code, arithmetic, or prose datasets.
  * Live interactive next-token probability bars.
  * Real-time self-attention heatmap visualization rendered on HTML5 Canvas.

### 📊 9. VRAM & System Monitor
* **Active GPU Allocation:** Real-time VRAM consumption tracker and active model count.
* **Process Table (`/api/ps`):** View loaded model processes, quantization formats, allocated context sizes, and auto-unload expiration countdowns.
* **One-Click Memory Flush (`/api/unload`):** Instantly unload idle models from GPU memory (`keep_alive: 0`) without terminating Ollama.
* **Ping Latency:** Continuous health check and latency gauge for the Ollama backend daemon.

---

## 🏗️ Architecture

OllamaVisual follows a clean, decoupled architecture:

```
┌────────────────────────────────────────────────────────┐
│                   Browser Client                       │
│  (Vanilla HTML5, Glassmorphism CSS, JS State Machine)  │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP & SSE Streams
┌───────────────────────────▼────────────────────────────┐
│               Node.js Express Server                   │
│  - Static Asset Server (public/)                       │
│  - Dataset File Manager (data/datasets/)               │
│  - Training Job Coordinator                            │
│  - Low-latency Ollama Stream Proxy (ndjson)            │
└───────────────────────────┬────────────────────────────┘
                            │ Native Fetch (Proxy)
┌───────────────────────────▼────────────────────────────┐
│                    Ollama Daemon                       │
│              (http://127.0.0.1:11434)                  │
│  - Local Models & Weights (GGUF)                       │
│  - GPU Inference Engine (VRAM)                         │
└────────────────────────────────────────────────────────┘
```

* **No Build Step Required:** No Webpack, Vite, or Babel required—clone and run immediately.
* **Lightweight Dependencies:** Powered exclusively by `express` and `cors`.
* **Zero Telemetry / 100% Local:** All data, prompts, images, and model weights remain strictly on your local machine.

---

## 🚀 Quick Start

### Prerequisites
1. **Node.js:** Version `18.0.0` or higher ([Download Node.js](https://nodejs.org/)).
2. **Ollama:** Installed and running locally ([Download Ollama](https://ollama.com/)).
3. **At least one model installed:**
   ```bash
   ollama pull llama3.2:3b
   # or pull a reasoning / code model
   ollama pull qwen2.5-coder:7b
   ```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ShaharZohar/OllamaVisual.git
cd OllamaVisual

# 2. Install dependencies
npm install

# 3. Ensure Ollama is running
ollama serve
# (Or verify that the Ollama menu-bar / background app is active)

# 4. Start OllamaVisual
npm start
```

Open your browser and navigate to:
```
http://localhost:3000
```

> **Development Mode:** You can also run `npm run dev` to launch the server.

---

## ⚙️ Configuration

OllamaVisual works out of the box with zero configuration. To point to an external or custom Ollama server, set environment variables:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | Port for the OllamaVisual web server |
| `OLLAMA_HOST` | `http://127.0.0.1:11434` | URL of the local or remote Ollama backend daemon |

### Connecting to Remote or LAN Ollama Instances

If Ollama is hosted on another machine, GPU rig, or Docker container:

```bash
# Linux / macOS
OLLAMA_HOST="http://192.168.1.100:11434" PORT=8080 npm start

# Windows (PowerShell)
$env:OLLAMA_HOST="http://192.168.1.100:11434"; $env:PORT="8080"; npm start
```

> **Note:** If hosting Ollama on a separate server, ensure Ollama is listening on network interfaces by launching it with `OLLAMA_HOST=0.0.0.0:11434 ollama serve`.

---

## 🧭 Feature Tour

### 1. Chat Studio & Multimodal Vision
* **Switching Models:** Use the quick selector in the top bar or sidebar to switch models on the fly.
* **Attaching Images:** Click the image icon <i data-lucide="image-plus"></i> or press `⌘V` / `Ctrl+V` to paste an image directly from your clipboard.
* **Reasoning Models:** Send a query to a thinking model like `deepseek-r1` or `gemma4:31b` and watch the reasoning chain unfold live inside a dedicated thought bubble.

### 2. Side-by-Side Model Arena
1. Click **Model Arena** in the sidebar.
2. Select **Model A** (e.g. `llama3.2:3b`) and **Model B** (e.g. `qwen2.5:7b`).
3. Enter a prompt (e.g. *"Implement an LRU Cache in Rust with unit tests"*).
4. Click **Run Duel** to compare token output speeds, formatting, and correctness simultaneously.

### 3. Creating Custom Models in Model Forge
1. Navigate to **Model Sandbox** > **Model Forge**.
2. Provide a name (e.g. `my-clean-coder`).
3. Select a base model from your installed weights.
4. Choose an architecture preset (*Code Specialist*, *Step-by-Step Reasoner*, etc.) or write custom behavioral directives.
5. Review the generated `Modelfile` preview.
6. Click **Compile & Build in Ollama** to build the model via Ollama's `/api/create` stream.
7. Click **Test in Chat Studio** once the build completes.

### 4. Synthetic Data Distillation
1. Navigate to **Model Sandbox** > **Dataset Studio**.
2. Select an existing dataset or click **New Dataset**.
3. In the distillation box, enter a topic (e.g. *"Python memory leaks & garbage collection"*).
4. Select the pair count and click **Generate Pairs**.
5. Your active teacher model synthesizes instruction-output pairs. Edit or tweak them directly in the table and click **Save Dataset Changes**.

### 5. Managing VRAM & GPU Resources
1. Click **VRAM & System** in the sidebar.
2. Inspect all models currently occupying GPU memory.
3. Click **Free VRAM** on any running model to instantly release GPU memory without having to restart Ollama.

---

## 🔌 API Endpoints

OllamaVisual acts as a transparent proxy to Ollama while adding dataset and training job state management:

### Ollama Proxy Endpoints
| Method | Endpoint | Upstream Target | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/version` | `/api/version` | Ollama version and ping latency check |
| `GET` | `/api/tags` | `/api/tags` | List all locally installed models |
| `GET` | `/api/ps` | `/api/ps` | List processes currently loaded in VRAM |
| `POST` | `/api/show` | `/api/show` | Retrieve Modelfile, parameters, template, and tensors |
| `POST` | `/api/chat` | `/api/chat` | Streaming chat completions (`ndjson`) |
| `POST` | `/api/generate` | `/api/generate` | Single-turn streaming generation (`ndjson`) |
| `POST` | `/api/pull` | `/api/pull` | Pull model from Ollama registry with progress stream |
| `DELETE` | `/api/delete` | `/api/delete` | Delete model from local storage |
| `POST` | `/api/copy` | `/api/copy` | Clone an existing model with a new tag |
| `POST` | `/api/unload` | `/api/generate` | Unloads a model from VRAM by setting `keep_alive: 0` |
| `POST` | `/api/create` | `/api/create` | Build a custom model from a Modelfile |

### Sandbox & Dataset Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/datasets` | List all local JSON training datasets |
| `POST` | `/api/datasets` | Create or update an Alpaca-format dataset |
| `DELETE` | `/api/datasets/:id` | Remove a dataset file |
| `GET` | `/api/training/jobs` | Retrieve active and completed training jobs |
| `POST` | `/api/training/start` | Launch a LoRA fine-tuning training job |
| `POST` | `/api/training/stop` | Terminate an active training run |

---

## 📁 Project Structure

```
OllamaVisual/
├── data/
│   └── datasets/              # Persisted JSON datasets for fine-tuning & distillation
│       └── starter_reasoning.json
├── public/
│   ├── index.html             # Single-page application markup & modals
│   ├── styles.css             # Glassmorphic design system & animations
│   └── app.js                 # Frontend application controller & state machine
├── package.json               # Node.js project manifest & scripts
├── package-lock.json
├── server.js                  # Express backend, streaming proxy & dataset storage
└── README.md                  # Project documentation
```

---

## 🎨 UI & Design Aesthetics

OllamaVisual is designed with modern developer experience principles:
* **Glassmorphic Depth:** Multi-layered translucency (`backdrop-filter: blur(16px)`), subtle neon borders, and glowing background ambient orbs.
* **Curated Typography:** Dual font stack featuring **Inter** for clean UI readability and **JetBrains Mono** for code blocks, metrics, and tensor layers.
* **Instant Responsiveness:** Zero virtual DOM overhead—direct DOM updates ensure high framerate rendering even under intensive streaming outputs.
* **Keyboard-First Workflows:** <kbd>Enter</kbd> to send, <kbd>Shift + Enter</kbd> for multi-line inputs, and <kbd>⌘V</kbd> / <kbd>Ctrl+V</kbd> to paste images.

---

## 🤝 Contributing

Contributions are very welcome! If you'd like to contribute:

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

Crafted with ⚡ for the local AI and open-source LLM community.

</div>
