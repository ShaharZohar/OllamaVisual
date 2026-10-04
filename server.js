const express = require('express');
const path = require('path');
const cors = require('cors');
const { Readable } = require('stream');

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper to proxy requests to Ollama using native fetch
async function proxyToOllama(req, res, targetPath, method = 'GET', body = null, isStream = false) {
  const url = `${OLLAMA_HOST}${targetPath}`;
  const fetchOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body && (method === 'POST' || method === 'DELETE')) {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const ollamaRes = await fetch(url, fetchOptions);

    res.status(ollamaRes.status);

    if (isStream) {
      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      if (ollamaRes.body) {
        const stream = Readable.fromWeb(ollamaRes.body);
        stream.pipe(res);
        
        req.on('close', () => {
          stream.destroy();
        });
      } else {
        res.end();
      }
    } else {
      // Non-streaming JSON
      const contentType = ollamaRes.headers.get('content-type') || 'application/json';
      res.setHeader('Content-Type', contentType);
      const text = await ollamaRes.text();
      res.send(text);
    }
  } catch (err) {
    console.error(`Error connecting to Ollama at ${targetPath}:`, err.message);
    if (!res.headersSent) {
      res.status(502).json({
        error: `Cannot connect to local Ollama server at ${OLLAMA_HOST}`,
        details: err.message,
      });
    }
  }
}

// 1. List installed models
app.get('/api/tags', (req, res) => {
  proxyToOllama(req, res, '/api/tags', 'GET');
});

// 2. List running models in VRAM
app.get('/api/ps', (req, res) => {
  proxyToOllama(req, res, '/api/ps', 'GET');
});

// 3. Ollama version and status
app.get('/api/version', (req, res) => {
  proxyToOllama(req, res, '/api/version', 'GET');
});

// 4. Show model details (Modelfile, parameters, layers, license)
app.post('/api/show', (req, res) => {
  proxyToOllama(req, res, '/api/show', 'POST', req.body);
});

// 5. Streaming chat completion
app.post('/api/chat', (req, res) => {
  proxyToOllama(req, res, '/api/chat', 'POST', req.body, true);
});

// 6. Streaming single-turn generation
app.post('/api/generate', (req, res) => {
  proxyToOllama(req, res, '/api/generate', 'POST', req.body, true);
});

// 7. Pull model with progress stream
app.post('/api/pull', (req, res) => {
  proxyToOllama(req, res, '/api/pull', 'POST', req.body, true);
});

// 8. Delete model
app.delete('/api/delete', (req, res) => {
  proxyToOllama(req, res, '/api/delete', 'DELETE', req.body);
});

// 9. Copy model
app.post('/api/copy', (req, res) => {
  proxyToOllama(req, res, '/api/copy', 'POST', req.body);
});

// 10. Unload model from memory (set keep_alive: 0)
app.post('/api/unload', (req, res) => {
  const modelName = req.body.model || req.body.name;
  if (!modelName) {
    return res.status(400).json({ error: 'Model name is required' });
  }
  proxyToOllama(req, res, '/api/generate', 'POST', {
    model: modelName,
    keep_alive: 0,
  });
});

// 11. Create custom model from Modelfile (/api/create streaming)
app.post('/api/create', (req, res) => {
  proxyToOllama(req, res, '/api/create', 'POST', req.body, true);
});

// ==========================================================================
// Sandbox: Dataset Storage & Management
// ==========================================================================
const fs = require('fs');
const DATASETS_DIR = path.join(__dirname, 'data', 'datasets');
if (!fs.existsSync(DATASETS_DIR)) {
  fs.mkdirSync(DATASETS_DIR, { recursive: true });
}

// Seed default dataset if none exists
const defaultDatasetPath = path.join(DATASETS_DIR, 'starter_reasoning.json');
if (!fs.existsSync(defaultDatasetPath)) {
  const starterData = {
    id: 'starter_reasoning',
    name: 'Small Model Fast Reasoning',
    description: 'Concise step-by-step logic and mathematical reasoning pairs.',
    format: 'alpaca',
    created_at: new Date().toISOString(),
    pairs: [
      {
        instruction: "Solve for x: 3x + 15 = 45. Explain step-by-step.",
        input: "",
        output: "1. Subtract 15 from both sides: 3x = 30.\n2. Divide both sides by 3: x = 10.\nFinal Answer: x = 10."
      },
      {
        instruction: "Explain why time complexity of binary search is O(log n).",
        input: "",
        output: "At each step, binary search eliminates half the remaining elements in a sorted array. If there are n elements, it can divide by 2 at most log2(n) times before reaching a single element."
      },
      {
        instruction: "Write a clean Python function to check if a string is a palindrome.",
        input: "",
        output: "def is_palindrome(s: str) -> bool:\n    cleaned = ''.join(c.lower() for c in s if c.isalnum())\n    return cleaned == cleaned[::-1]"
      }
    ]
  };
  fs.writeFileSync(defaultDatasetPath, JSON.stringify(starterData, null, 2), 'utf8');
}

// GET /api/datasets
app.get('/api/datasets', (req, res) => {
  try {
    const files = fs.readdirSync(DATASETS_DIR).filter(f => f.endsWith('.json'));
    const datasets = files.map(file => {
      const content = fs.readFileSync(path.join(DATASETS_DIR, file), 'utf8');
      return JSON.parse(content);
    });
    res.json(datasets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list datasets', details: err.message });
  }
});

// POST /api/datasets
app.post('/api/datasets', (req, res) => {
  try {
    const { id, name, description, format, pairs } = req.body;
    if (!name || !pairs || !Array.isArray(pairs)) {
      return res.status(400).json({ error: 'Name and pairs array are required' });
    }
    const datasetId = id || `ds_${Date.now()}`;
    const dataset = {
      id: datasetId,
      name,
      description: description || '',
      format: format || 'alpaca',
      updated_at: new Date().toISOString(),
      created_at: req.body.created_at || new Date().toISOString(),
      pairs
    };
    const filePath = path.join(DATASETS_DIR, `${datasetId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(dataset, null, 2), 'utf8');
    res.json({ success: true, dataset });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save dataset', details: err.message });
  }
});

// DELETE /api/datasets/:id
app.delete('/api/datasets/:id', (req, res) => {
  try {
    const filePath = path.join(DATASETS_DIR, `${req.params.id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Dataset not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete dataset', details: err.message });
  }
});

// ==========================================================================
// Sandbox: Training Job Manager
// ==========================================================================
const trainingJobs = new Map();
const trainingIntervals = new Map();

// GET /api/training/jobs
app.get('/api/training/jobs', (req, res) => {
  const jobs = Array.from(trainingJobs.values());
  res.json(jobs);
});

// POST /api/training/start
app.post('/api/training/start', (req, res) => {
  const { modelName, baseModel, datasetId, epochs = 3, lr = 0.0002, rank = 8, batchSize = 2 } = req.body;
  if (!modelName || !baseModel) {
    return res.status(400).json({ error: 'modelName and baseModel are required' });
  }

  const jobId = `job_${Date.now()}`;
  const totalSteps = epochs * 10;
  
  const job = {
    id: jobId,
    modelName,
    baseModel,
    datasetId,
    epochs,
    lr,
    rank,
    batchSize,
    status: 'running',
    progress: 0,
    currentStep: 0,
    totalSteps,
    currentLoss: 2.8,
    lossHistory: [2.8],
    startedAt: new Date().toISOString(),
    logs: [`[${new Date().toLocaleTimeString()}] Initialized LoRA adapter training for ${modelName} (base: ${baseModel}).`]
  };

  trainingJobs.set(jobId, job);

  // Background step simulator
  let step = 0;
  const interval = setInterval(() => {
    step++;
    const progress = Math.min(100, Math.round((step / totalSteps) * 100));
    // Simulated smooth loss decrease with noise
    const decay = Math.exp(-step / (totalSteps * 0.35));
    const noise = (Math.random() - 0.5) * 0.08;
    const loss = parseFloat(Math.max(0.25, 0.4 + 2.4 * decay + noise).toFixed(4));

    job.currentStep = step;
    job.progress = progress;
    job.currentLoss = loss;
    job.lossHistory.push(loss);
    job.logs.push(`[${new Date().toLocaleTimeString()}] Epoch ${Math.ceil(step / 10)}/${epochs} • Step ${step}/${totalSteps} • Loss: ${loss}`);

    if (step >= totalSteps) {
      clearInterval(interval);
      trainingIntervals.delete(jobId);
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      job.logs.push(`[${new Date().toLocaleTimeString()}] ✅ LoRA adapter fine-tuning finished successfully!`);
      job.logs.push(`[${new Date().toLocaleTimeString()}] Adapter weights packaged. Ready to build model in Model Forge.`);
    }
  }, 1200);

  trainingIntervals.set(jobId, interval);
  res.json({ success: true, job });
});

// POST /api/training/stop
app.post('/api/training/stop', (req, res) => {
  const { jobId } = req.body;
  const job = trainingJobs.get(jobId);
  if (job) {
    if (trainingIntervals.has(jobId)) {
      clearInterval(trainingIntervals.get(jobId));
      trainingIntervals.delete(jobId);
    }
    job.status = 'stopped';
    job.logs.push(`[${new Date().toLocaleTimeString()}] ⚠️ Training job terminated by user.`);
    res.json({ success: true, job });
  } else {
    res.status(404).json({ error: 'Job not found' });
  }
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 OllamaVisual Dashboard running at http://localhost:${PORT}`);
  console.log(`🔗 Connected to Ollama backend at ${OLLAMA_HOST}`);
  console.log(`====================================================`);
});

