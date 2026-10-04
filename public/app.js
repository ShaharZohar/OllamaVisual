/**
 * OllamaVisual — Interactive Model Hub & Studio
 * Client Application Logic
 * Featuring Persona Manager, Prompt Templates, Multimodal Vision, and num_ctx Controls
 */

// Core Constants & Defaults from Gemma 4 Architecture
const STORAGE_KEYS = {
  PERSONAS: 'ov_custom_personas',
  TEMPLATES: 'ov_custom_templates',
  ACTIVE_PERSONA: 'ov_active_persona',
  SETTINGS: 'ov_settings'
};

const DEFAULT_PERSONAS = [
  { 
    id: 'p1', 
    name: 'Python Master', 
    icon: '🐍', 
    description: 'Expert in PEP8, async patterns, type hints, and optimization.', 
    systemPrompt: 'You are an expert Python developer. Provide clean, efficient, and well-documented code. Focus on type hinting, idiomatic design, and modern Python 3.11+ features.' 
  },
  { 
    id: 'p2', 
    name: 'Creative Wordsmith', 
    icon: '✍️', 
    description: 'High-end copywriting, narrative storytelling, and marketing.', 
    systemPrompt: 'You are a world-class copywriter and novelist. Use evocative language, varied sentence structures, and emotional resonance.' 
  },
  { 
    id: 'p3', 
    name: 'Senior DevOps Architect', 
    icon: '☁️', 
    description: 'Kubernetes, Terraform, Docker, and CI/CD pipelines.', 
    systemPrompt: 'You are a Senior DevOps Architect. Prioritize scalability, security, resilience, and the "Infrastructure as Code" philosophy.' 
  },
  { 
    id: 'p4', 
    name: 'Deep Reasoner', 
    icon: '🧠', 
    description: 'Step-by-step analytical reasoning and logic deduction.', 
    systemPrompt: 'You are a logical reasoning engine. Break down complex problems into first principles and think step-by-step before providing the final answer.' 
  },
  { 
    id: 'p5', 
    name: 'Concise Assistant', 
    icon: '⚡', 
    description: 'Direct, zero-fluff answers with maximum accuracy.', 
    systemPrompt: 'You are a minimalist assistant. Provide the shortest possible accurate answer. No introductions, no conclusions, no pleasantries.' 
  },
  {
    id: 'p6',
    name: 'Full-Stack Architect',
    icon: '💻',
    description: 'Modern TypeScript, React, Node.js, and API design.',
    systemPrompt: 'You are a Principal Full-Stack Software Engineer. Write clean, modular, production-ready code with strong types and error handling.'
  }
];

const DEFAULT_TEMPLATES = [
  { 
    id: 't1', 
    category: 'Coding', 
    title: 'Code Refactoring', 
    description: 'Clean up, simplify, and optimize existing code.', 
    templateText: 'Please refactor the following code for better readability, modularity, and performance. Explain the key changes made:\n\n```\n{{input}}\n```' 
  },
  { 
    id: 't2', 
    category: 'Database', 
    title: 'SQL Query Optimizer', 
    description: 'Diagnose and improve slow SQL queries.', 
    templateText: 'Analyze this SQL query for performance bottlenecks, explain the execution plan considerations, and provide an optimized version with recommended indexes:\n\n```sql\n{{input}}\n```' 
  },
  { 
    id: 't3', 
    category: 'Writing', 
    title: 'Comprehensive Summary', 
    description: 'Turn long text into an executive summary & takeaways.', 
    templateText: 'Summarize the following text into a high-level executive overview (2-3 sentences), followed by a bulleted list of the top key takeaways and action items:\n\n{{input}}' 
  },
  { 
    id: 't4', 
    category: 'Coding', 
    title: 'Bug Hunter', 
    description: 'Find logical errors, edge cases, and memory leaks.', 
    templateText: 'Act as a Senior QA & Security Engineer. Inspect this code for potential edge cases, logic bugs, race conditions, or security vulnerabilities:\n\n```\n{{input}}\n```' 
  },
  { 
    id: 't5', 
    category: 'Coding', 
    title: 'Unit Test Generator', 
    description: 'Generate complete unit tests with mocks and edge cases.', 
    templateText: 'Write a comprehensive set of unit tests covering edge cases and error paths for the following function:\n\n```\n{{input}}\n```' 
  },
  { 
    id: 't6', 
    category: 'Regex', 
    title: 'Regex Builder & Explainer', 
    description: 'Create regular expressions with explanatory breakdowns.', 
    templateText: 'Create a regular expression that matches the following criteria:\n{{input}}\n\nProvide test case examples (matching and non-matching) and explain each token in the pattern.' 
  },
  {
    id: 't7',
    category: 'Writing',
    title: 'Code Review & Feedback',
    description: 'Constructive code review focusing on best practices.',
    templateText: 'Perform a detailed code review of the following snippet. Highlight what was done well, potential risks, and concrete suggestions for improvement:\n\n```\n{{input}}\n```'
  }
];

// Application State
const state = {
  models: [],
  runningModels: [],
  activeModel: 'gemma4:31b',
  activeFilter: 'all',
  searchQuery: '',
  chatHistory: [],
  isStreaming: false,
  abortController: null,
  currentImages: [], // Array of { name, data, preview }
  activePersona: DEFAULT_PERSONAS[4], // Default to Concise Assistant
  params: {
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    max_tokens: 2048,
    num_ctx: 4096,
    repeat_penalty: 1.1,
    system_prompt: DEFAULT_PERSONAS[4].systemPrompt
  }
};

// DOM Element Selectors
const elements = {
  navItems: document.querySelectorAll('.nav-item'),
  viewPanels: document.querySelectorAll('.view-panel'),
  currentViewTitle: document.getElementById('current-view-title'),
  currentViewDesc: document.getElementById('current-view-desc'),
  
  // Status
  statusIndicator: document.getElementById('status-indicator'),
  statusText: document.getElementById('status-text'),
  statusDetails: document.getElementById('status-details'),
  serverPing: document.getElementById('server-ping'),
  refreshAllBtn: document.getElementById('refresh-all-btn'),
  navModelsCount: document.getElementById('nav-models-count'),
  navRunningCount: document.getElementById('nav-running-count'),
  navActiveModelBadge: document.getElementById('nav-active-model-badge'),
  headerModelSelect: document.getElementById('header-model-select'),
  topbarChatBtn: document.getElementById('topbar-chat-btn'),
  topbarTemplatesBtn: document.getElementById('topbar-templates-btn'),
  
  // Models View
  modelsGrid: document.getElementById('models-grid-container'),
  modelSearchInput: document.getElementById('model-search-input'),
  filterChips: document.querySelectorAll('.filter-chips .chip'),
  
  // Chat Studio View
  chatMessages: document.getElementById('chat-messages-container'),
  chatWelcomeCard: document.getElementById('chat-welcome-card'),
  chatActiveName: document.getElementById('chat-active-name'),
  chatActiveMeta: document.getElementById('chat-active-meta'),
  welcomeModelName: document.getElementById('welcome-model-name'),
  chatPersonaSelect: document.getElementById('chat-persona-select'),
  managePersonasBtn: document.getElementById('manage-personas-btn'),
  chatOpenTemplatesBtn: document.getElementById('chat-open-templates-btn'),
  chatUserInput: document.getElementById('chat-user-input'),
  sendMessageBtn: document.getElementById('send-message-btn'),
  stopGenerationBtn: document.getElementById('stop-generation-btn'),
  clearChatBtn: document.getElementById('clear-chat-btn'),
  exportChatBtn: document.getElementById('export-chat-btn'),
  toggleSettingsBtn: document.getElementById('toggle-settings-btn'),
  closeSettingsBtn: document.getElementById('close-settings-btn'),
  studioSettingsDrawer: document.getElementById('studio-settings-drawer'),
  liveMetricsBar: document.getElementById('live-metrics-bar'),
  metricSpeed: document.getElementById('metric-speed'),
  metricTokens: document.getElementById('metric-tokens'),
  metricTtft: document.getElementById('metric-ttft'),
  metricElapsed: document.getElementById('metric-elapsed'),
  inputModelLabel: document.getElementById('input-model-label'),
  inputCtxLabel: document.getElementById('input-ctx-label'),
  inputPersonaLabel: document.getElementById('input-persona-label'),
  
  // Multimodal Image Elements
  attachImageBtn: document.getElementById('attach-image-btn'),
  attachedImagesCount: document.getElementById('attached-images-count'),
  promptTemplateBtn: document.getElementById('prompt-template-btn'),
  clearInputTextBtn: document.getElementById('clear-input-text-btn'),
  hintPersonaPill: document.getElementById('hint-persona-pill'),
  imageFileInput: document.getElementById('image-file-input'),
  imagePreviewTray: document.getElementById('image-preview-tray'),
  chatDropZone: document.getElementById('chat-drop-zone'),
  
  // Tuning Params
  drawerPersonaSelect: document.getElementById('drawer-persona-select'),
  drawerManagePersonaBtn: document.getElementById('drawer-manage-persona-btn'),
  customSystemPrompt: document.getElementById('custom-system-prompt'),
  paramNumCtx: document.getElementById('param-num-ctx'),
  valNumCtx: document.getElementById('val-num-ctx'),
  paramTemp: document.getElementById('param-temp'),
  valTemp: document.getElementById('val-temp'),
  paramTopP: document.getElementById('param-topp'),
  valTopP: document.getElementById('val-topp'),
  paramTopK: document.getElementById('param-topk'),
  valTopK: document.getElementById('val-topk'),
  paramMaxTokens: document.getElementById('param-max-tokens'),
  valMaxTokens: document.getElementById('val-max-tokens'),
  paramRepeatPenalty: document.getElementById('param-repeat-penalty'),
  valRepeatPenalty: document.getElementById('val-repeat-penalty'),
  resetParamsBtn: document.getElementById('reset-params-btn'),
  
  // Arena View
  arenaRunBtn: document.getElementById('arena-run-btn'),
  arenaPromptInput: document.getElementById('arena-prompt-input'),
  arenaModelASelect: document.getElementById('arena-model-a-select'),
  arenaModelBSelect: document.getElementById('arena-model-b-select'),
  arenaOutputA: document.getElementById('arena-output-a'),
  arenaOutputB: document.getElementById('arena-output-b'),
  arenaSpeedA: document.getElementById('arena-speed-a'),
  arenaTokA: document.getElementById('arena-tok-a'),
  arenaTimeA: document.getElementById('arena-time-a'),
  arenaSpeedB: document.getElementById('arena-speed-b'),
  arenaTokB: document.getElementById('arena-tok-b'),
  arenaTimeB: document.getElementById('arena-time-b'),
  
  // VRAM View
  vramActiveCount: document.getElementById('vram-active-count'),
  vramTotalSize: document.getElementById('vram-total-size'),
  ollamaVersionDisplay: document.getElementById('ollama-version-display'),
  runningModelsTbody: document.getElementById('running-models-tbody'),
  refreshPsBtn: document.getElementById('refresh-ps-btn'),
  
  // Persona Modal
  personaModal: document.getElementById('persona-modal'),
  closePersonaModalBtn: document.getElementById('close-persona-modal-btn'),
  cancelPersonaBtn: document.getElementById('cancel-persona-btn'),
  savePersonaBtn: document.getElementById('save-persona-btn'),
  personaCardsList: document.getElementById('persona-cards-list'),
  newPersonaIcon: document.getElementById('new-persona-icon'),
  newPersonaName: document.getElementById('new-persona-name'),
  newPersonaDesc: document.getElementById('new-persona-desc'),
  newPersonaPrompt: document.getElementById('new-persona-prompt'),
  personaFormTitle: document.getElementById('persona-form-title'),
  
  // Prompt Templates Modal
  templatesModal: document.getElementById('templates-modal'),
  closeTemplatesBtn: document.getElementById('close-templates-btn'),
  templateSearchInput: document.getElementById('template-search-input'),
  templateCategoriesBar: document.getElementById('template-categories-bar'),
  templatesGridContainer: document.getElementById('templates-grid-container'),
  openNewTemplateBtn: document.getElementById('open-new-template-btn'),
  customTemplateForm: document.getElementById('custom-template-form'),
  newTemplateTitle: document.getElementById('new-template-title'),
  newTemplateCat: document.getElementById('new-template-cat'),
  newTemplateDesc: document.getElementById('new-template-desc'),
  newTemplateText: document.getElementById('new-template-text'),
  cancelCustomTemplateBtn: document.getElementById('cancel-custom-template-btn'),
  saveCustomTemplateBtn: document.getElementById('save-custom-template-btn'),
  
  // Modals (Inspector & Pull)
  inspectorModal: document.getElementById('inspector-modal'),
  closeInspectorBtn: document.getElementById('close-inspector-btn'),
  inspectorModelTitle: document.getElementById('inspector-model-title'),
  inspectorModelDigest: document.getElementById('inspector-model-digest'),
  inspectorModelfile: document.getElementById('inspector-modelfile'),
  inspectorParams: document.getElementById('inspector-params'),
  inspectorTemplate: document.getElementById('inspector-template'),
  inspectorTensors: document.getElementById('inspector-tensors'),
  inspectorTensorsSummary: document.getElementById('inspector-tensors-summary'),
  inspectorLicense: document.getElementById('inspector-license'),
  modalTabs: document.querySelectorAll('.modal-tab'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  pullModal: document.getElementById('pull-modal'),
  openPullBtn: document.getElementById('open-pull-btn'),
  closePullBtn: document.getElementById('close-pull-btn'),
  cancelPullModalBtn: document.getElementById('cancel-pull-modal-btn'),
  startPullBtn: document.getElementById('start-pull-btn'),
  pullModelInput: document.getElementById('pull-model-input'),
  popularChips: document.querySelectorAll('.pop-chip'),
  pullProgressBox: document.getElementById('pull-progress-box'),
  pullProgressBar: document.getElementById('pull-progress-bar'),
  pullStatusText: document.getElementById('pull-status-text'),
  pullPercentText: document.getElementById('pull-percent-text'),
  pullDetailsText: document.getElementById('pull-details-text'),
  
  // Toast
  toastContainer: document.getElementById('toast-container'),

  // Sandbox View Elements
  sandboxView: document.getElementById('sandbox-view'),
  sandboxTabs: document.querySelectorAll('.sandbox-tab'),
  sandboxSubpanels: document.querySelectorAll('.sandbox-subpanel'),
  
  // Forge
  forgeModelName: document.getElementById('forge-model-name'),
  forgeBaseModel: document.getElementById('forge-base-model'),
  forgePresetChips: document.querySelectorAll('.preset-chips .chip'),
  forgeSystemPrompt: document.getElementById('forge-system-prompt'),
  forgeParamTemp: document.getElementById('forge-param-temp'),
  forgeValTemp: document.getElementById('forge-val-temp'),
  forgeParamCtx: document.getElementById('forge-param-ctx'),
  forgeValCtx: document.getElementById('forge-val-ctx'),
  forgeAdapterPath: document.getElementById('forge-adapter-path'),
  buildModelBtn: document.getElementById('build-model-btn'),
  modelfileCode: document.getElementById('modelfile-code'),
  copyModelfileBtn: document.getElementById('copy-modelfile-btn'),
  terminalStatusPill: document.getElementById('terminal-status-pill'),
  terminalStatusText: document.getElementById('terminal-status-text'),
  forgeProgressTrack: document.getElementById('forge-progress-track'),
  forgeProgressBar: document.getElementById('forge-progress-bar'),
  forgeTerminalStream: document.getElementById('forge-terminal-stream'),
  forgeSuccessFooter: document.getElementById('forge-success-footer'),
  testNewModelBtn: document.getElementById('test-new-model-btn'),

  // Datasets
  datasetSelect: document.getElementById('dataset-select'),
  newDatasetBtn: document.getElementById('new-dataset-btn'),
  exportDatasetBtn: document.getElementById('export-dataset-btn'),
  deleteDatasetBtn: document.getElementById('delete-dataset-btn'),
  distillTopicInput: document.getElementById('distill-topic-input'),
  distillCount: document.getElementById('distill-count'),
  runDistillBtn: document.getElementById('run-distill-btn'),
  datasetActiveTitle: document.getElementById('dataset-active-title'),
  datasetPairCount: document.getElementById('dataset-pair-count'),
  addPairRowBtn: document.getElementById('add-pair-row-btn'),
  datasetPairsTbody: document.getElementById('dataset-pairs-tbody'),
  saveDatasetChangesBtn: document.getElementById('save-dataset-changes-btn'),

  // Training
  trainTargetName: document.getElementById('train-target-name'),
  trainBaseModel: document.getElementById('train-base-model'),
  trainDatasetSelect: document.getElementById('train-dataset-select'),
  trainEpochs: document.getElementById('train-epochs'),
  trainBatchSize: document.getElementById('train-batch-size'),
  trainLr: document.getElementById('train-lr'),
  trainRank: document.getElementById('train-rank'),
  startTrainingBtn: document.getElementById('start-training-btn'),
  stopTrainingBtn: document.getElementById('stop-training-btn'),
  lossCanvas: document.getElementById('loss-canvas'),
  monitorLossVal: document.getElementById('monitor-loss-val'),
  trainStatusText: document.getElementById('train-status-text'),
  trainStepText: document.getElementById('train-step-text'),
  trainProgressText: document.getElementById('train-progress-text'),
  trainingTerminalStream: document.getElementById('training-terminal-stream'),

  // Neural Simulator
  simCorpusSelect: document.getElementById('sim-corpus-select'),
  simStepBtn: document.getElementById('sim-step-btn'),
  simTrainBtn: document.getElementById('sim-train-btn'),
  simResetBtn: document.getElementById('sim-reset-btn'),
  simPromptInput: document.getElementById('sim-prompt-input'),
  simProbBars: document.getElementById('sim-prob-bars'),
  attentionCanvas: document.getElementById('attention-canvas'),
  simLossBadge: document.getElementById('sim-loss-badge')
};

// Configure Marked for Markdown rendering
if (window.marked) {
  window.marked.setOptions({
    highlight: function(code, lang) {
      if (window.hljs && lang && window.hljs.getLanguage(lang)) {
        try {
          return window.hljs.highlight(code, { language: lang }).value;
        } catch (e) {
          console.error(e);
        }
      }
      return window.hljs ? window.hljs.highlightAuto(code).value : code;
    },
    breaks: true,
    gfm: true
  });
}

// ==========================================================================
// Toast Notification Utility
// ==========================================================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-triangle';
  
  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${message}</span>
  `;
  
  elements.toastContainer.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Format bytes helper
function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// ==========================================================================
// 1. PERSONA MANAGER (Authored by gemma4:31b architecture)
// ==========================================================================
const PersonaManager = {
  loadPersonas: () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.PERSONAS)) || [];
      return [...DEFAULT_PERSONAS, ...saved];
    } catch (e) {
      return DEFAULT_PERSONAS;
    }
  },

  savePersona: (personaData) => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.PERSONAS)) || [];
    const newPersona = {
      ...personaData,
      id: `user_p_${Date.now()}`
    };
    saved.push(newPersona);
    localStorage.setItem(STORAGE_KEYS.PERSONAS, JSON.stringify(saved));
    return newPersona;
  },

  deletePersona: (id) => {
    let saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.PERSONAS)) || [];
    saved = saved.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PERSONAS, JSON.stringify(saved));
  },

  selectPersona: (persona) => {
    state.activePersona = persona;
    state.params.system_prompt = persona.systemPrompt;
    elements.customSystemPrompt.value = persona.systemPrompt;
    elements.chatPersonaSelect.value = persona.id;
    elements.drawerPersonaSelect.value = persona.id;
    elements.inputPersonaLabel.textContent = `${persona.icon || ''} ${persona.name}`;
    showToast(`Active Persona: ${persona.name}`, 'info');
  }
};

function renderPersonaDropdowns() {
  const personas = PersonaManager.loadPersonas();
  const optionsHtml = personas.map(p => `
    <option value="${p.id}">${p.icon || '🤖'} ${p.name}</option>
  `).join('');

  elements.chatPersonaSelect.innerHTML = optionsHtml;
  elements.drawerPersonaSelect.innerHTML = optionsHtml;

  if (state.activePersona) {
    elements.chatPersonaSelect.value = state.activePersona.id;
    elements.drawerPersonaSelect.value = state.activePersona.id;
    elements.inputPersonaLabel.textContent = `${state.activePersona.icon || ''} ${state.activePersona.name}`;
  }
}

function renderPersonaModalList() {
  const personas = PersonaManager.loadPersonas();
  elements.personaCardsList.innerHTML = personas.map(p => {
    const isCustom = p.id.startsWith('user_');
    return `
      <div class="persona-card-item">
        <div class="persona-item-info">
          <span class="persona-item-icon">${p.icon || '🤖'}</span>
          <div>
            <div class="persona-item-title">${p.name} ${isCustom ? '<span class="badge" style="font-size:0.65rem;">Custom</span>' : ''}</div>
            <div class="persona-item-desc">${p.description || ''}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-secondary btn-sm" onclick="selectPersonaById('${p.id}')">Select</button>
          ${isCustom ? `
            <button class="btn btn-danger btn-sm" onclick="deletePersonaById('${p.id}')">
              <i data-lucide="trash-2"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

window.selectPersonaById = function(id) {
  const personas = PersonaManager.loadPersonas();
  const found = personas.find(p => p.id === id);
  if (found) {
    PersonaManager.selectPersona(found);
    elements.personaModal.classList.remove('active');
  }
};

window.deletePersonaById = function(id) {
  PersonaManager.deletePersona(id);
  renderPersonaDropdowns();
  renderPersonaModalList();
  showToast('Persona deleted', 'info');
};

function setupPersonaListeners() {
  // Dropdown change in chat header
  elements.chatPersonaSelect.addEventListener('change', (e) => {
    const personas = PersonaManager.loadPersonas();
    const selected = personas.find(p => p.id === e.target.value);
    if (selected) PersonaManager.selectPersona(selected);
  });

  // Dropdown change in settings drawer
  elements.drawerPersonaSelect.addEventListener('change', (e) => {
    const personas = PersonaManager.loadPersonas();
    const selected = personas.find(p => p.id === e.target.value);
    if (selected) PersonaManager.selectPersona(selected);
  });

  // Open Manage Personas Modal
  const openModal = () => {
    renderPersonaModalList();
    elements.personaModal.classList.add('active');
  };
  elements.managePersonasBtn.addEventListener('click', openModal);
  elements.drawerManagePersonaBtn.addEventListener('click', openModal);

  const closeModal = () => elements.personaModal.classList.remove('active');
  elements.closePersonaModalBtn.addEventListener('click', closeModal);
  elements.cancelPersonaBtn.addEventListener('click', closeModal);

  // Save new persona
  elements.savePersonaBtn.addEventListener('click', () => {
    const name = elements.newPersonaName.value.trim();
    const icon = elements.newPersonaIcon.value.trim() || '🤖';
    const desc = elements.newPersonaDesc.value.trim();
    const prompt = elements.newPersonaPrompt.value.trim();

    if (!name || !prompt) {
      showToast('Please provide a name and system prompt', 'error');
      return;
    }

    const created = PersonaManager.savePersona({
      name,
      icon,
      description: desc,
      systemPrompt: prompt
    });

    renderPersonaDropdowns();
    renderPersonaModalList();
    PersonaManager.selectPersona(created);

    // Reset form
    elements.newPersonaName.value = '';
    elements.newPersonaDesc.value = '';
    elements.newPersonaPrompt.value = '';
    showToast(`Created persona "${name}"!`, 'success');
  });
}

// ==========================================================================
// 2. PROMPT TEMPLATES LIBRARY (Authored by gemma4:31b architecture)
// ==========================================================================
const TemplateLibrary = {
  loadTemplates: () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLATES)) || [];
      return [...DEFAULT_TEMPLATES, ...saved];
    } catch (e) {
      return DEFAULT_TEMPLATES;
    }
  },

  filterByCategory: (category) => {
    const all = TemplateLibrary.loadTemplates();
    if (!category || category === 'all') return all;
    return all.filter(t => t.category.toLowerCase() === category.toLowerCase());
  },

  searchTemplates: (query, category = 'all') => {
    const q = query.toLowerCase();
    return TemplateLibrary.filterByCategory(category).filter(t => 
      t.title.toLowerCase().includes(q) || 
      t.description.toLowerCase().includes(q) || 
      t.templateText.toLowerCase().includes(q)
    );
  },

  applyTemplate: (templateId) => {
    const templates = TemplateLibrary.loadTemplates();
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const currentVal = elements.chatUserInput.value.trim();
    let textToInsert = template.templateText;

    if (textToInsert.includes('{{input}}')) {
      textToInsert = textToInsert.replace('{{input}}', currentVal || '');
    } else if (currentVal) {
      textToInsert = `${textToInsert}\n\n${currentVal}`;
    }

    elements.chatUserInput.value = textToInsert;
    elements.chatUserInput.style.height = 'auto';
    elements.chatUserInput.style.height = (elements.chatUserInput.scrollHeight) + 'px';
    elements.templatesModal.classList.remove('active');
    switchView('chat-view');
    elements.chatUserInput.focus();
    showToast(`Applied template "${template.title}"`, 'success');
  },

  saveCustomTemplate: (templateData) => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLATES)) || [];
    const newTemplate = {
      ...templateData,
      id: `user_t_${Date.now()}`
    };
    saved.push(newTemplate);
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(saved));
    return newTemplate;
  }
};

let activeTemplateCat = 'all';

function renderTemplatesGrid() {
  const query = elements.templateSearchInput.value.trim();
  const templates = TemplateLibrary.searchTemplates(query, activeTemplateCat);

  if (templates.length === 0) {
    elements.templatesGridContainer.innerHTML = `
      <div class="loading-state" style="grid-column: 1 / -1; padding: 40px 20px;">
        <i data-lucide="search-x" style="width:36px;height:36px;color:#64748b;margin:0 auto 8px auto;"></i>
        <p class="text-muted">No templates found in this category.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  elements.templatesGridContainer.innerHTML = templates.map(t => {
    const isCustom = t.id.startsWith('user_');
    const previewSnippet = escapeHtml(t.templateText);
    return `
      <div class="template-card">
        <div>
          <div class="template-card-header">
            <span class="template-title">${t.title}</span>
            <span class="template-cat-badge">${t.category}</span>
          </div>
          <p class="template-desc mt-2">${t.description}</p>
          <div class="template-preview-box mt-2">${previewSnippet}</div>
        </div>
        <div class="template-card-footer">
          <span class="text-xs text-muted">${isCustom ? '⭐ Custom' : '⚡ Built-in'}</span>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary btn-sm" onclick="copyTemplateText('${t.id}')" title="Copy template text">
              <i data-lucide="copy"></i>
            </button>
            <button class="btn btn-primary btn-sm" onclick="applyTemplateById('${t.id}')">
              <i data-lucide="arrow-up-right"></i>
              <span>Insert in Chat</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

window.copyTemplateText = function(id) {
  const templates = TemplateLibrary.loadTemplates();
  const template = templates.find(t => t.id === id);
  if (template) {
    navigator.clipboard.writeText(template.templateText);
    showToast(`Copied template "${template.title}" to clipboard`, 'success');
  }
};

window.applyTemplateById = function(id) {
  TemplateLibrary.applyTemplate(id);
};

function setupTemplateListeners() {
  const openModal = () => {
    renderTemplatesGrid();
    elements.templatesModal.classList.add('active');
  };

  elements.topbarTemplatesBtn.addEventListener('click', openModal);
  elements.chatOpenTemplatesBtn.addEventListener('click', openModal);
  elements.closeTemplatesBtn.addEventListener('click', () => {
    elements.templatesModal.classList.remove('active');
  });

  // Search & Categories
  elements.templateSearchInput.addEventListener('input', renderTemplatesGrid);

  elements.templateCategoriesBar.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      elements.templateCategoriesBar.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeTemplateCat = chip.getAttribute('data-cat');
      renderTemplatesGrid();
    });
  });

  // Toggle Custom Template Form
  elements.openNewTemplateBtn.addEventListener('click', () => {
    elements.customTemplateForm.classList.toggle('hidden');
  });
  elements.cancelCustomTemplateBtn.addEventListener('click', () => {
    elements.customTemplateForm.classList.add('hidden');
  });

  elements.saveCustomTemplateBtn.addEventListener('click', () => {
    const title = elements.newTemplateTitle.value.trim();
    const cat = elements.newTemplateCat.value.trim() || 'Custom';
    const desc = elements.newTemplateDesc.value.trim();
    const text = elements.newTemplateText.value.trim();

    if (!title || !text) {
      showToast('Please provide a title and template content', 'error');
      return;
    }

    TemplateLibrary.saveCustomTemplate({
      title,
      category: cat,
      description: desc,
      templateText: text
    });

    elements.newTemplateTitle.value = '';
    elements.newTemplateCat.value = '';
    elements.newTemplateDesc.value = '';
    elements.newTemplateText.value = '';
    elements.customTemplateForm.classList.add('hidden');
    renderTemplatesGrid();
    showToast(`Saved template "${title}"!`, 'success');
  });
}

// ==========================================================================
// 3. MULTIMODAL IMAGE HANDLER (Authored by gemma4:31b architecture)
// ==========================================================================
const ImageHandler = {
  fileToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result;
        // Clean base64 string without data:image/... prefix for Ollama API
        const cleanBase64 = base64String.split(',')[1];
        resolve({ clean: cleanBase64, full: base64String });
      };
      reader.onerror = (error) => reject(error);
    });
  },

  handleImageUpload: async (files) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      showToast('Please select valid image files', 'error');
      return;
    }

    const processed = await Promise.all(
      fileArray.map(async (file) => {
        const { clean, full } = await ImageHandler.fileToBase64(file);
        return {
          name: file.name,
          data: clean,
          preview: full
        };
      })
    );

    state.currentImages.push(...processed);
    renderImagePreviewTray();
    showToast(`Attached ${processed.length} image(s) for Multimodal Vision`, 'info');
  },

  removeImage: (index) => {
    state.currentImages.splice(index, 1);
    renderImagePreviewTray();
  },

  clearImages: () => {
    state.currentImages = [];
    renderImagePreviewTray();
  }
};

function renderImagePreviewTray() {
  if (state.currentImages.length === 0) {
    elements.imagePreviewTray.classList.add('hidden');
    elements.imagePreviewTray.innerHTML = '';
    if (elements.attachedImagesCount) {
      elements.attachedImagesCount.classList.add('hidden');
      elements.attachedImagesCount.textContent = '0';
    }
    return;
  }

  if (elements.attachedImagesCount) {
    elements.attachedImagesCount.classList.remove('hidden');
    elements.attachedImagesCount.textContent = state.currentImages.length;
  }

  elements.imagePreviewTray.classList.remove('hidden');
  elements.imagePreviewTray.innerHTML = state.currentImages.map((img, idx) => `
    <div class="image-thumb-card">
      <img src="${img.preview}" alt="${img.name}" title="${img.name}">
      <button class="remove-img-btn" onclick="removeAttachedImage(${idx})" title="Remove Image">✕</button>
    </div>
  `).join('');
}

window.removeAttachedImage = function(index) {
  ImageHandler.removeImage(index);
};

function setupImageUploadListeners() {
  elements.attachImageBtn.addEventListener('click', () => {
    elements.imageFileInput.click();
  });

  elements.imageFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      ImageHandler.handleImageUpload(e.target.files);
      elements.imageFileInput.value = '';
    }
  });

  // Paste image directly from clipboard (Cmd+V / Ctrl+V)
  elements.chatUserInput.addEventListener('paste', (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData || !clipboardData.items) return;
    
    const imageFiles = [];
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      if (item.type && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      ImageHandler.handleImageUpload(imageFiles);
      showToast(`Pasted image from clipboard`, 'info');
    }
  });

  // Drag and drop onto chat input container
  const dropZone = elements.chatDropZone;
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      ImageHandler.handleImageUpload(e.dataTransfer.files);
    }
  });
}

// ==========================================================================
// Server Status & Model Data Fetching
// ==========================================================================
async function checkServerStatus() {
  const startTime = performance.now();
  try {
    const res = await fetch('/api/version');
    const latency = Math.round(performance.now() - startTime);
    if (res.ok) {
      const data = await res.json();
      elements.statusIndicator.className = 'status-indicator online';
      elements.statusText.textContent = 'Ollama Online';
      elements.statusDetails.innerHTML = `v${data.version || '0.5.x'} • <span id="server-ping">${latency} ms</span>`;
      elements.ollamaVersionDisplay.textContent = `v${data.version || '0.5.x'}`;
      return true;
    } else {
      throw new Error('Server returned non-200');
    }
  } catch (err) {
    elements.statusIndicator.className = 'status-indicator offline';
    elements.statusText.textContent = 'Ollama Offline';
    elements.statusDetails.textContent = 'Cannot connect :11434';
    return false;
  }
}

async function fetchModels() {
  try {
    const [tagsRes, psRes] = await Promise.all([
      fetch('/api/tags'),
      fetch('/api/ps')
    ]);

    if (!tagsRes.ok) throw new Error('Failed to fetch installed models');
    const tagsData = await tagsRes.json();
    state.models = tagsData.models || [];

    if (psRes.ok) {
      const psData = await psRes.json();
      state.runningModels = psData.models || [];
    } else {
      state.runningModels = [];
    }

    elements.navModelsCount.textContent = state.models.length;
    elements.navRunningCount.textContent = `${state.runningModels.length} Loaded`;

    const hasGemma = state.models.some(m => m.name.includes('gemma4'));
    if (!state.activeModel || !state.models.some(m => m.name === state.activeModel)) {
      if (hasGemma) {
        state.activeModel = state.models.find(m => m.name.includes('gemma4')).name;
      } else if (state.models.length > 0) {
        state.activeModel = state.models[0].name;
      }
    }

    updateActiveModelUI();
    populateSelectDropdowns();
    renderModelsGrid();
    renderVramView();
  } catch (err) {
    console.error('Error loading models:', err);
    elements.modelsGrid.innerHTML = `
      <div class="loading-state">
        <i data-lucide="alert-circle" style="width:48px;height:48px;color:#f43f5e;margin:0 auto 12px auto;"></i>
        <h3 style="color:#fff;">Ollama Connection Error</h3>
        <p class="text-muted mt-2">Make sure Ollama is running locally on port 11434.</p>
        <button class="btn btn-primary btn-sm mt-4" onclick="fetchModels()">
          <i data-lucide="refresh-cw"></i> Retry Connection
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }
}

function updateActiveModelUI() {
  const currentModel = state.models.find(m => m.name === state.activeModel);
  elements.navActiveModelBadge.textContent = state.activeModel.split(':')[0];
  elements.chatActiveName.textContent = state.activeModel;
  elements.welcomeModelName.textContent = state.activeModel;
  elements.inputModelLabel.textContent = state.activeModel;
  
  if (currentModel) {
    const paramSize = currentModel.details?.parameter_size || 'N/A';
    const quant = currentModel.details?.quantization_level || 'Default';
    const family = currentModel.details?.family || 'LLM';
    elements.chatActiveMeta.textContent = `${family.toUpperCase()} • ${paramSize} Parameters • ${quant}`;
    elements.chatUserInput.placeholder = `Ask ${state.activeModel} or drop an image... (Shift+Enter for new line, Enter to send)`;
  }
  
  if (elements.headerModelSelect.value !== state.activeModel) {
    elements.headerModelSelect.value = state.activeModel;
  }
}

function populateSelectDropdowns() {
  const optionsHtml = state.models.map(m => {
    const isRunning = state.runningModels.some(r => r.name === m.name);
    const param = m.details?.parameter_size ? ` (${m.details.parameter_size})` : '';
    const runningTag = isRunning ? ' 🔥 [VRAM]' : '';
    return `<option value="${m.name}">${m.name}${param}${runningTag}</option>`;
  }).join('');

  elements.headerModelSelect.innerHTML = optionsHtml;
  elements.headerModelSelect.value = state.activeModel;

  elements.arenaModelASelect.innerHTML = optionsHtml;
  elements.arenaModelBSelect.innerHTML = optionsHtml;

  if (state.models.length > 0) {
    elements.arenaModelASelect.value = state.models[0].name;
    elements.arenaModelBSelect.value = state.models.length > 1 ? state.models[1].name : state.models[0].name;
  }

  if (elements.forgeBaseModel) {
    elements.forgeBaseModel.innerHTML = optionsHtml;
  }
  if (elements.trainBaseModel) {
    elements.trainBaseModel.innerHTML = optionsHtml;
  }
}

// ==========================================================================
// View Navigation
// ==========================================================================
const viewMetadata = {
  'models-view': {
    title: 'Models Library',
    desc: 'Explore installed local weights, inspect parameters, and launch interactive sessions.'
  },
  'chat-view': {
    title: 'Interactive Studio',
    desc: 'Conversational playground with real-time token streaming, multimodal images, personas, and templates.'
  },
  'arena-view': {
    title: 'Model Arena',
    desc: 'Benchmark two models side-by-side with synchronized streaming and throughput metrics.'
  },
  'sandbox-view': {
    title: 'Model Sandbox & Training Lab',
    desc: 'Visual Modelfile builder, synthetic data distillation with gemma4:31b, LoRA fine-tuning, and neural network simulation.'
  },
  'vram-view': {
    title: 'VRAM & System Status',
    desc: 'Live GPU/CPU memory allocation and loaded model process manager.'
  }
};

elements.navItems.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetViewId = btn.getAttribute('data-view');
    switchView(targetViewId);
  });
});

elements.topbarChatBtn.addEventListener('click', () => {
  switchView('chat-view');
});

function switchView(targetViewId) {
  elements.navItems.forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-view') === targetViewId);
  });
  
  elements.viewPanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === targetViewId);
  });

  const meta = viewMetadata[targetViewId] || { title: 'OllamaVisual', desc: '' };
  elements.currentViewTitle.textContent = meta.title;
  elements.currentViewDesc.textContent = meta.desc;

  if (window.lucide) window.lucide.createIcons();
}

elements.headerModelSelect.addEventListener('change', (e) => {
  state.activeModel = e.target.value;
  updateActiveModelUI();
  showToast(`Switched active model to ${state.activeModel}`, 'info');
});

// ==========================================================================
// VIEW 1: Models Grid Rendering
// ==========================================================================
function renderModelsGrid() {
  let filtered = state.models.filter(m => {
    const matchSearch = !state.searchQuery || 
      m.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      (m.details?.family && m.details.family.toLowerCase().includes(state.searchQuery.toLowerCase())) ||
      (m.details?.parameter_size && m.details.parameter_size.toLowerCase().includes(state.searchQuery.toLowerCase()));

    if (!matchSearch) return false;

    if (state.activeFilter === 'running') {
      return state.runningModels.some(r => r.name === m.name);
    }
    if (state.activeFilter === 'thinking') {
      return m.name.includes('gemma4') || m.name.includes('deepseek') || m.name.includes('r1') || m.name.includes('qwq');
    }
    if (state.activeFilter === 'large') {
      const sizeStr = m.details?.parameter_size || '';
      const num = parseFloat(sizeStr);
      return num >= 30 || m.name.includes('31b') || m.name.includes('70b');
    }
    if (state.activeFilter === 'tools') {
      return m.capabilities?.includes('tools') || m.name.includes('gemma4') || m.name.includes('llama3');
    }
    return true;
  });

  if (filtered.length === 0) {
    elements.modelsGrid.innerHTML = `
      <div class="loading-state">
        <i data-lucide="search-x" style="width:48px;height:48px;color:#64748b;margin:0 auto 12px auto;"></i>
        <h3 style="color:#fff;">No models match your filter</h3>
        <p class="text-muted mt-2">Try adjusting your search query or filter tags.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  elements.modelsGrid.innerHTML = filtered.map(model => {
    const isRunning = state.runningModels.some(r => r.name === model.name);
    const paramSize = model.details?.parameter_size || 'Standard';
    const quantLevel = model.details?.quantization_level || 'GGUF';
    const family = (model.details?.family || 'LLM').toUpperCase();
    const diskSize = formatBytes(model.size);
    const modDate = model.modified_at ? new Date(model.modified_at).toLocaleDateString() : 'Local';
    const isThinking = model.name.includes('gemma4') || model.name.includes('deepseek') || model.name.includes('r1');
    const isVision = model.name.includes('llava') || model.name.includes('vision') || model.capabilities?.includes('vision');
    const isGemma4 = model.name.includes('gemma4');

    return `
      <div class="model-card">
        <div class="model-card-header">
          <div class="model-title-wrap">
            <div class="model-icon-box" style="${isGemma4 ? 'background:rgba(168,85,247,0.15);border-color:rgba(168,85,247,0.4);color:#c084fc;' : ''}">
              <i data-lucide="${isGemma4 ? 'sparkles' : (isVision ? 'image' : 'cpu')}"></i>
            </div>
            <div>
              <div class="model-name">${model.name}</div>
              <div class="model-family">${family} ARCHITECTURE • ${modDate}</div>
            </div>
          </div>
          <span class="model-status-badge ${isRunning ? 'running' : ''}">
            <span class="status-dot"></span>
            ${isRunning ? 'In VRAM' : 'On Disk'}
          </span>
        </div>

        <div class="model-specs-grid">
          <div class="spec-item">
            <span class="spec-label">Params</span>
            <span class="spec-value">${paramSize}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Quant</span>
            <span class="spec-value">${quantLevel}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Size</span>
            <span class="spec-value">${diskSize}</span>
          </div>
        </div>

        <div class="model-capabilities">
          ${isThinking ? '<span class="cap-badge thinking">💡 Thinking Model</span>' : ''}
          ${isVision ? '<span class="cap-badge" style="background:rgba(16,185,129,0.15);color:#34d399;border-color:rgba(16,185,129,0.35);">👁️ Multimodal Vision</span>' : ''}
          <span class="cap-badge tools">🛠️ Tools</span>
          <span class="cap-badge">⚡ Completion</span>
          ${isGemma4 ? '<span class="cap-badge" style="background:rgba(6,182,212,0.15);color:#38bdf8;border-color:rgba(6,182,212,0.3);">🌟 Gemma 4 Flagship</span>' : ''}
        </div>

        <div class="model-card-actions">
          <button class="btn btn-primary btn-sm" onclick="selectAndChat('${model.name}')">
            <i data-lucide="message-square"></i>
            <span>Chat</span>
          </button>
          <button class="btn btn-secondary btn-sm" onclick="openInspector('${model.name}')" title="Inspect Modelfile & Tensors">
            <i data-lucide="info"></i>
            <span>Inspect</span>
          </button>
          ${isRunning ? `
            <button class="btn btn-secondary btn-sm" onclick="unloadModel('${model.name}')" title="Unload from VRAM">
              <i data-lucide="log-out"></i>
              <span>Unload</span>
            </button>
          ` : ''}
          <button class="btn btn-danger btn-sm" onclick="deleteModel('${model.name}')" title="Delete model weights">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

elements.modelSearchInput.addEventListener('input', (e) => {
  state.searchQuery = e.target.value;
  renderModelsGrid();
});

elements.filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    elements.filterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.activeFilter = chip.getAttribute('data-filter');
    renderModelsGrid();
  });
});

window.selectAndChat = function(modelName) {
  state.activeModel = modelName;
  updateActiveModelUI();
  switchView('chat-view');
  elements.chatUserInput.focus();
};

window.unloadModel = async function(modelName) {
  try {
    showToast(`Unloading ${modelName} from VRAM...`, 'info');
    const res = await fetch('/api/unload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelName })
    });
    if (res.ok) {
      showToast(`Successfully unloaded ${modelName}`, 'success');
      fetchModels();
    } else {
      throw new Error('Unload failed');
    }
  } catch (err) {
    showToast(`Failed to unload: ${err.message}`, 'error');
  }
};

window.deleteModel = async function(modelName) {
  if (!confirm(`Are you sure you want to delete model "${modelName}"? This will delete local weights.`)) {
    return;
  }
  try {
    const res = await fetch('/api/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName })
    });
    if (res.ok) {
      showToast(`Deleted ${modelName}`, 'success');
      fetchModels();
    } else {
      throw new Error('Delete failed');
    }
  } catch (err) {
    showToast(`Failed to delete: ${err.message}`, 'error');
  }
};

// ==========================================================================
// Model Inspector Modal
// ==========================================================================
window.openInspector = async function(modelName) {
  elements.inspectorModal.classList.add('active');
  elements.inspectorModelTitle.textContent = `Inspecting: ${modelName}`;
  elements.inspectorModelDigest.textContent = 'Fetching details from /api/show...';
  
  elements.inspectorModelfile.textContent = 'Loading Modelfile...';
  elements.inspectorParams.textContent = 'Loading Parameters...';
  elements.inspectorTemplate.textContent = 'Loading Template...';
  elements.inspectorTensors.textContent = 'Loading Tensors...';
  elements.inspectorTensorsSummary.innerHTML = '';
  elements.inspectorLicense.textContent = 'Loading License...';

  try {
    const res = await fetch('/api/show', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelName })
    });
    
    if (!res.ok) throw new Error('Failed to fetch model details');
    const data = await res.json();

    elements.inspectorModelDigest.textContent = data.details?.format ? `Format: ${data.details.format.toUpperCase()} | Parameter Size: ${data.details.parameter_size || 'N/A'}` : 'Details loaded';
    elements.inspectorModelfile.textContent = data.modelfile || '# No Modelfile available';
    elements.inspectorParams.textContent = data.parameters || '# Default parameters';
    elements.inspectorTemplate.textContent = data.template || '# Default template';
    elements.inspectorLicense.textContent = data.license || 'No license specified.';

    if (data.tensors && data.tensors.length > 0) {
      elements.inspectorTensorsSummary.innerHTML = `
        <div class="mb-2 text-xs" style="color:var(--cyan-primary);font-weight:600;">
          Total Tensors: ${data.tensors.length} Layers & Weight Blocks
        </div>
      `;
      elements.inspectorTensors.textContent = JSON.stringify(data.tensors.slice(0, 50), null, 2) + 
        (data.tensors.length > 50 ? `\n\n... and ${data.tensors.length - 50} more tensor layers` : '');
    } else if (data.model_info) {
      elements.inspectorTensors.textContent = JSON.stringify(data.model_info, null, 2);
    } else {
      elements.inspectorTensors.textContent = 'Tensor details not available';
    }

    if (window.hljs) {
      window.hljs.highlightElement(elements.inspectorModelfile);
      window.hljs.highlightElement(elements.inspectorParams);
      window.hljs.highlightElement(elements.inspectorTemplate);
      window.hljs.highlightElement(elements.inspectorTensors);
    }
  } catch (err) {
    elements.inspectorModelfile.textContent = `Error: ${err.message}`;
  }
};

elements.closeInspectorBtn.addEventListener('click', () => {
  elements.inspectorModal.classList.remove('active');
});

elements.modalTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    elements.modalTabs.forEach(t => t.classList.remove('active'));
    elements.tabPanes.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const targetId = tab.getAttribute('data-tab');
    document.getElementById(targetId)?.classList.add('active');
  });
});

// ==========================================================================
// VIEW 2: Chat Studio & Streaming
// ==========================================================================
function setupChatControls() {
  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      elements.chatUserInput.value = prompt;
      elements.chatUserInput.focus();
      sendMessage();
    });
  });

  // Parameter bindings
  elements.paramNumCtx.addEventListener('change', (e) => {
    state.params.num_ctx = parseInt(e.target.value);
    elements.valNumCtx.textContent = e.target.value;
    elements.inputCtxLabel.textContent = e.target.value;
    showToast(`Context Window set to ${e.target.value} tokens`, 'info');
  });

  elements.paramTemp.addEventListener('input', (e) => {
    state.params.temperature = parseFloat(e.target.value);
    elements.valTemp.textContent = e.target.value;
  });
  elements.paramTopP.addEventListener('input', (e) => {
    state.params.top_p = parseFloat(e.target.value);
    elements.valTopP.textContent = e.target.value;
  });
  elements.paramTopK.addEventListener('input', (e) => {
    state.params.top_k = parseInt(e.target.value);
    elements.valTopK.textContent = e.target.value;
  });
  elements.paramMaxTokens.addEventListener('input', (e) => {
    state.params.max_tokens = parseInt(e.target.value);
    elements.valMaxTokens.textContent = e.target.value;
  });
  elements.paramRepeatPenalty.addEventListener('input', (e) => {
    state.params.repeat_penalty = parseFloat(e.target.value);
    elements.valRepeatPenalty.textContent = e.target.value;
  });

  elements.customSystemPrompt.addEventListener('input', (e) => {
    state.params.system_prompt = e.target.value;
  });

  elements.resetParamsBtn.addEventListener('click', () => {
    elements.paramNumCtx.value = 4096;
    elements.valNumCtx.textContent = '4096';
    elements.paramTemp.value = 0.7;
    elements.valTemp.textContent = '0.7';
    elements.paramTopP.value = 0.9;
    elements.valTopP.textContent = '0.9';
    elements.paramTopK.value = 40;
    elements.valTopK.textContent = '40';
    elements.paramMaxTokens.value = 2048;
    elements.valMaxTokens.textContent = '2048';
    elements.paramRepeatPenalty.value = 1.1;
    elements.valRepeatPenalty.textContent = '1.1';
    
    PersonaManager.selectPersona(DEFAULT_PERSONAS[4]);
    state.params = {
      temperature: 0.7,
      top_p: 0.9,
      top_k: 40,
      max_tokens: 2048,
      num_ctx: 4096,
      repeat_penalty: 1.1,
      system_prompt: DEFAULT_PERSONAS[4].systemPrompt
    };
    elements.inputCtxLabel.textContent = '4096';
    showToast('Parameters reset to default', 'info');
  });

  // Toggle Settings Drawer
  elements.toggleSettingsBtn.addEventListener('click', () => {
    elements.studioSettingsDrawer.classList.toggle('hidden');
  });
  elements.closeSettingsBtn.addEventListener('click', () => {
    elements.studioSettingsDrawer.classList.add('hidden');
  });

  // Chat Input Keyboard
  elements.chatUserInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  elements.chatUserInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if (elements.clearInputTextBtn) {
      if (this.value.length > 0) {
        elements.clearInputTextBtn.classList.remove('hidden');
      } else {
        elements.clearInputTextBtn.classList.add('hidden');
      }
    }
  });

  if (elements.clearInputTextBtn) {
    elements.clearInputTextBtn.addEventListener('click', () => {
      elements.chatUserInput.value = '';
      elements.chatUserInput.style.height = 'auto';
      elements.clearInputTextBtn.classList.add('hidden');
      elements.chatUserInput.focus();
    });
  }

  if (elements.promptTemplateBtn) {
    elements.promptTemplateBtn.addEventListener('click', () => {
      renderTemplatesGrid();
      elements.templatesModal.classList.add('active');
    });
  }

  if (elements.hintPersonaPill) {
    elements.hintPersonaPill.addEventListener('click', () => {
      renderPersonaModalList();
      elements.personaModal.classList.add('active');
    });
  }

  elements.sendMessageBtn.addEventListener('click', sendMessage);
  
  elements.stopGenerationBtn.addEventListener('click', () => {
    if (state.abortController) {
      state.abortController.abort();
      state.isStreaming = false;
      updateStreamingState(false);
      showToast('Generation stopped', 'info');
    }
  });

  elements.clearChatBtn.addEventListener('click', () => {
    state.chatHistory = [];
    ImageHandler.clearImages();
    elements.chatMessages.innerHTML = '';
    elements.chatMessages.appendChild(elements.chatWelcomeCard);
    elements.chatWelcomeCard.classList.remove('hidden');
    elements.liveMetricsBar.classList.add('hidden');
    showToast('Conversation cleared', 'info');
  });

  elements.exportChatBtn.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.chatHistory, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `ollama-chat-${state.activeModel}-${Date.now()}.json`);
    dlAnchorElem.click();
    showToast('Conversation exported as JSON', 'success');
  });
}

function updateStreamingState(isStreaming) {
  state.isStreaming = isStreaming;
  elements.sendMessageBtn.classList.toggle('hidden', isStreaming);
  elements.stopGenerationBtn.classList.toggle('hidden', !isStreaming);
  elements.liveMetricsBar.classList.toggle('hidden', !isStreaming && state.chatHistory.length === 0);
}

function extractThinking(rawText) {
  let thinking = '';
  let cleaned = rawText;

  const thinkRegex = /<think>([\s\S]*?)<\/think>/i;
  const thinkMatch = rawText.match(thinkRegex);
  if (thinkMatch) {
    thinking = thinkMatch[1].trim();
    cleaned = rawText.replace(thinkRegex, '').trim();
    return { thinking, content: cleaned };
  }

  const openThinkRegex = /<think>([\s\S]*)$/i;
  const openMatch = rawText.match(openThinkRegex);
  if (openMatch) {
    thinking = openMatch[1].trim();
    cleaned = rawText.replace(openThinkRegex, '').trim();
    return { thinking, content: cleaned, inProgress: true };
  }

  const thoughtRegex = /<thought>([\s\S]*?)<\/thought>/i;
  const thoughtMatch = rawText.match(thoughtRegex);
  if (thoughtMatch) {
    thinking = thoughtMatch[1].trim();
    cleaned = rawText.replace(thoughtRegex, '').trim();
    return { thinking, content: cleaned };
  }

  return { thinking: '', content: cleaned };
}

async function sendMessage() {
  const text = elements.chatUserInput.value.trim();
  const attachedImages = [...state.currentImages];
  
  if ((!text && attachedImages.length === 0) || state.isStreaming) return;

  elements.chatWelcomeCard.classList.add('hidden');

  // Push user message (with images if any)
  const userMsg = { 
    role: 'user', 
    content: text || '(Attached image)', 
    images: attachedImages.map(img => img.data),
    previews: attachedImages.map(img => img.preview),
    timestamp: new Date() 
  };
  state.chatHistory.push(userMsg);

  appendMessageBubble('user', text || '(Attached image)', attachedImages);
  
  // Reset input and image preview tray
  elements.chatUserInput.value = '';
  elements.chatUserInput.style.height = 'auto';
  ImageHandler.clearImages();

  const assistantMsgId = `assistant-msg-${Date.now()}`;
  const assistantBubble = createAssistantBubble(assistantMsgId);
  elements.chatMessages.appendChild(assistantBubble);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

  state.abortController = new AbortController();
  updateStreamingState(true);

  const startTime = performance.now();
  let firstTokenTime = null;
  let tokenCount = 0;

  // Prepare messages payload (including base64 images for multimodal vision models)
  const messagesPayload = [];
  if (state.params.system_prompt) {
    messagesPayload.push({ role: 'system', content: state.params.system_prompt });
  }
  state.chatHistory.forEach(msg => {
    const item = { role: msg.role, content: msg.content };
    if (msg.images && msg.images.length > 0) {
      item.images = msg.images;
    }
    messagesPayload.push(item);
  });

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: state.activeModel,
        messages: messagesPayload,
        options: {
          temperature: state.params.temperature,
          top_p: state.params.top_p,
          top_k: state.params.top_k,
          num_predict: state.params.max_tokens,
          num_ctx: state.params.num_ctx || 4096,
          repeat_penalty: state.params.repeat_penalty
        }
      }),
      signal: state.abortController.signal
    });

    if (!response.ok) {
      throw new Error(`Ollama error: HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedThinking = '';
    let accumulatedContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (!firstTokenTime) {
        firstTokenTime = performance.now();
        const ttft = Math.round(firstTokenTime - startTime);
        elements.metricTtft.textContent = `${ttft} ms`;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const chunk = JSON.parse(line);
          if (chunk.message) {
            if (chunk.message.thinking) {
              accumulatedThinking += chunk.message.thinking;
              tokenCount++;
            }
            if (chunk.message.content) {
              accumulatedContent += chunk.message.content;
              tokenCount++;
            }

            const elapsedSec = ((performance.now() - startTime) / 1000).toFixed(1);
            const speed = (tokenCount / (Math.max(0.1, (performance.now() - startTime) / 1000))).toFixed(1);
            elements.metricSpeed.textContent = `${speed} tok/s`;
            elements.metricTokens.textContent = tokenCount;
            elements.metricElapsed.textContent = `${elapsedSec}s`;

            updateAssistantBubble(assistantMsgId, accumulatedContent, accumulatedThinking);
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
          }

          if (chunk.done) {
            if (chunk.eval_count && chunk.eval_duration) {
              const actualSpeed = (chunk.eval_count / (chunk.eval_duration / 1e9)).toFixed(1);
              elements.metricSpeed.textContent = `${actualSpeed} tok/s`;
            }
          }
        } catch (parseErr) {
          console.error('NDJSON parse error:', parseErr);
        }
      }
    }

    const parsed = extractThinking(accumulatedContent);
    const finalThinking = accumulatedThinking || parsed.thinking;
    const finalContent = accumulatedThinking ? accumulatedContent : parsed.content;

    state.chatHistory.push({
      role: 'assistant',
      content: finalContent,
      thinking: finalThinking,
      timestamp: new Date(),
      metrics: {
        tokens: tokenCount,
        speed: elements.metricSpeed.textContent,
        elapsed: elements.metricElapsed.textContent
      }
    });

    fetchModels();
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Generation stopped by user');
    } else {
      console.error('Chat error:', err);
      updateAssistantBubble(assistantMsgId, `\n\n> ⚠️ **Error generating response:** ${err.message}`);
      showToast(`Error: ${err.message}`, 'error');
    }
  } finally {
    updateStreamingState(false);
    state.abortController = null;
    if (window.lucide) window.lucide.createIcons();
  }
}

function appendMessageBubble(role, content, attachedImages = []) {
  const bubble = document.createElement('div');
  bubble.className = `message-bubble ${role}`;

  let imagesHtml = '';
  if (attachedImages && attachedImages.length > 0) {
    imagesHtml = `
      <div class="message-images-grid">
        ${attachedImages.map(img => `<img class="message-image-thumb" src="${img.preview || img}" alt="Uploaded image">`).join('')}
      </div>
    `;
  }

  bubble.innerHTML = `
    <div class="message-header">
      <span>${role === 'user' ? 'You' : state.activeModel}</span>
      <span>•</span>
      <span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
    <div class="message-body">
      <div>${escapeHtml(content)}</div>
      ${imagesHtml}
    </div>
  `;
  elements.chatMessages.appendChild(bubble);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function createAssistantBubble(id) {
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble assistant';
  bubble.id = id;
  bubble.innerHTML = `
    <div class="message-header">
      <i data-lucide="bot" style="width:12px;height:12px;color:var(--cyan-primary);"></i>
      <span>${state.activeModel}</span>
      <span>•</span>
      <span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
    <div class="message-body">
      <div class="thinking-box hidden">
        <div class="thinking-header" onclick="this.parentElement.classList.toggle('collapsed')">
          <div class="thinking-header-left">
            <i data-lucide="brain"></i>
            <span>Thought Process (Reasoning)</span>
          </div>
          <i data-lucide="chevron-down"></i>
        </div>
        <div class="thinking-content"></div>
      </div>
      <div class="markdown-body"><span class="cursor-typing">▍</span></div>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
  return bubble;
}

function updateAssistantBubble(id, rawText, directThinking = '') {
  const bubble = document.getElementById(id);
  if (!bubble) return;

  const thinkingBox = bubble.querySelector('.thinking-box');
  const thinkingContent = bubble.querySelector('.thinking-content');
  const markdownBody = bubble.querySelector('.markdown-body');

  const { thinking: parsedThinking, content: parsedContent } = extractThinking(rawText);
  const thinking = directThinking || parsedThinking;
  const content = directThinking ? rawText : parsedContent;

  if (thinking) {
    thinkingBox.classList.remove('hidden');
    thinkingContent.textContent = thinking;
  } else {
    thinkingBox.classList.add('hidden');
  }

  if (content) {
    if (window.marked) {
      markdownBody.innerHTML = window.marked.parse(content);
      injectCopyButtons(markdownBody);
    } else {
      markdownBody.textContent = content;
    }
  } else if (state.isStreaming) {
    markdownBody.innerHTML = '<span class="cursor-typing" style="color:var(--cyan-primary);animation:pulse-glow 0.8s infinite;">▍ ' + (thinking ? 'Reasoning...' : 'Thinking...') + '</span>';
  }
}

function injectCopyButtons(container) {
  container.querySelectorAll('pre').forEach(pre => {
    if (pre.parentElement.classList.contains('code-block-wrapper')) return;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';
    
    const code = pre.querySelector('code');
    const langClass = code ? code.className : '';
    const langMatch = langClass.match(/language-(\w+)/);
    const lang = langMatch ? langMatch[1] : 'code';

    const header = document.createElement('div');
    header.className = 'code-header';
    header.innerHTML = `
      <span>${lang}</span>
      <button class="copy-code-btn">
        <i data-lucide="copy" style="width:12px;height:12px;"></i>
        <span>Copy</span>
      </button>
    `;

    const copyBtn = header.querySelector('.copy-code-btn');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(code ? code.innerText : pre.innerText);
      copyBtn.innerHTML = `<i data-lucide="check" style="width:12px;height:12px;color:#10b981;"></i><span style="color:#10b981;">Copied!</span>`;
      if (window.lucide) window.lucide.createIcons();
      setTimeout(() => {
        copyBtn.innerHTML = `<i data-lucide="copy" style="width:12px;height:12px;"></i><span>Copy</span>`;
        if (window.lucide) window.lucide.createIcons();
      }, 2000);
    });

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==========================================================================
// VIEW 3: Model Arena
// ==========================================================================
function setupArena() {
  elements.arenaRunBtn.addEventListener('click', async () => {
    const prompt = elements.arenaPromptInput.value.trim();
    const modelA = elements.arenaModelASelect.value;
    const modelB = elements.arenaModelBSelect.value;

    if (!prompt) {
      showToast('Please enter a prompt to test both models', 'error');
      return;
    }

    elements.arenaOutputA.innerHTML = '<div class="spinner"></div>';
    elements.arenaOutputB.innerHTML = '<div class="spinner"></div>';
    elements.arenaRunBtn.disabled = true;

    const runFighter = async (modelName, outputEl, speedEl, tokEl, timeEl) => {
      const startTime = performance.now();
      let tokens = 0;
      let text = '';

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            options: {
              num_ctx: state.params.num_ctx || 4096
            }
          })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (!line.trim()) continue;
            const chunk = JSON.parse(line);
            if (chunk.message?.content) {
              text += chunk.message.content;
              tokens++;
              const durationSec = ((performance.now() - startTime) / 1000).toFixed(1);
              const speed = (tokens / (Math.max(0.1, (performance.now() - startTime) / 1000))).toFixed(1);
              speedEl.textContent = `${speed} tok/s`;
              tokEl.textContent = tokens;
              timeEl.textContent = `${durationSec}s`;
              
              const { content } = extractThinking(text);
              outputEl.innerHTML = window.marked ? window.marked.parse(content) : content;
            }
          }
        }
      } catch (err) {
        outputEl.innerHTML = `<p style="color:#f43f5e;">Error: ${err.message}</p>`;
      }
    };

    await Promise.all([
      runFighter(modelA, elements.arenaOutputA, elements.arenaSpeedA, elements.arenaTokA, elements.arenaTimeA),
      runFighter(modelB, elements.arenaOutputB, elements.arenaSpeedB, elements.arenaTokB, elements.arenaTimeB)
    ]);

    elements.arenaRunBtn.disabled = false;
    showToast('Arena duel completed!', 'success');
  });
}

// ==========================================================================
// VIEW 4: VRAM & System Monitor
// ==========================================================================
function renderVramView() {
  elements.vramActiveCount.textContent = state.runningModels.length;
  
  let totalVram = 0;
  state.runningModels.forEach(m => {
    totalVram += (m.size_vram || m.size || 0);
  });
  elements.vramTotalSize.textContent = formatBytes(totalVram);

  if (state.runningModels.length === 0) {
    elements.runningModelsTbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted" style="padding:32px 16px;">
          <i data-lucide="check-circle" style="width:24px;height:24px;color:#10b981;margin:0 auto 8px auto;"></i>
          <div>No models currently loaded in VRAM (GPU memory is free)</div>
        </td>
      </tr>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  elements.runningModelsTbody.innerHTML = state.runningModels.map(m => {
    const vram = formatBytes(m.size_vram || m.size);
    const total = formatBytes(m.size);
    const quant = m.details?.quantization_level || 'Default';
    const ctx = m.context_length ? `${(m.context_length / 1024).toFixed(0)}K` : '32K';
    const expires = m.expires_at ? new Date(m.expires_at).toLocaleTimeString() : 'Auto';

    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:8px;font-weight:600;color:#fff;">
            <i data-lucide="cpu" style="width:14px;height:14px;color:var(--cyan-primary);"></i>
            ${m.name}
          </div>
        </td>
        <td><strong style="color:#10b981;">${vram}</strong></td>
        <td>${total}</td>
        <td><span class="badge">${quant}</span></td>
        <td>${ctx}</td>
        <td>${expires}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="unloadModel('${m.name}')">
            <i data-lucide="log-out"></i>
            <span>Free VRAM</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

elements.refreshPsBtn.addEventListener('click', () => {
  fetchModels();
  showToast('Refreshed process list', 'info');
});

// ==========================================================================
// Pull Model Modal & Logic
// ==========================================================================
function setupPullModel() {
  elements.openPullBtn.addEventListener('click', () => {
    elements.pullModal.classList.add('active');
  });

  const closePull = () => {
    elements.pullModal.classList.remove('active');
    elements.pullProgressBox.classList.add('hidden');
  };

  elements.closePullBtn.addEventListener('click', closePull);
  elements.cancelPullModalBtn.addEventListener('click', closePull);

  elements.popularChips.forEach(chip => {
    chip.addEventListener('click', () => {
      elements.pullModelInput.value = chip.getAttribute('data-tag');
    });
  });

  elements.startPullBtn.addEventListener('click', async () => {
    const tag = elements.pullModelInput.value.trim();
    if (!tag) {
      showToast('Please enter a model name to pull', 'error');
      return;
    }

    elements.pullProgressBox.classList.remove('hidden');
    elements.startPullBtn.disabled = true;
    elements.pullStatusText.textContent = `Connecting to Ollama registry for ${tag}...`;
    elements.pullProgressBar.style.width = '0%';
    elements.pullPercentText.textContent = '0%';
    elements.pullDetailsText.textContent = 'Initiating download...';

    try {
      const res = await fetch('/api/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tag })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.status) {
              elements.pullStatusText.textContent = data.status;
            }
            if (data.total && data.completed) {
              const pct = Math.round((data.completed / data.total) * 100);
              elements.pullProgressBar.style.width = `${pct}%`;
              elements.pullPercentText.textContent = `${pct}%`;
              elements.pullDetailsText.textContent = `${formatBytes(data.completed)} / ${formatBytes(data.total)}`;
            }
          } catch (e) {
            console.error(e);
          }
        }
      }

      showToast(`Successfully pulled ${tag}!`, 'success');
      elements.pullStatusText.textContent = `Downloaded and verified ${tag}`;
      fetchModels();
    } catch (err) {
      elements.pullStatusText.textContent = `Error pulling ${tag}: ${err.message}`;
      showToast(`Pull failed: ${err.message}`, 'error');
    } finally {
      elements.startPullBtn.disabled = false;
    }
  });
}

elements.refreshAllBtn.addEventListener('click', () => {
  checkServerStatus();
  fetchModels();
  showToast('Refreshed Ollama status and models', 'info');
});

// ==========================================================================
// Sandbox Module: Model Forge, Dataset Studio, Training Lab, Simulator
// ==========================================================================
const SandboxManager = {
  datasets: [],
  activeDataset: null,
  activeTrainingJob: null,
  trainingInterval: null,

  init: function() {
    this.setupTabs();
    this.setupForge();
    this.setupDatasets();
    this.setupTraining();
    this.setupSimulator();
  },

  // Sub-tabs navigation
  setupTabs: function() {
    elements.sandboxTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        elements.sandboxTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const targetSubtab = tab.getAttribute('data-subtab');
        elements.sandboxSubpanels.forEach(panel => {
          panel.classList.toggle('active', panel.id === `subpanel-${targetSubtab}`);
        });
        if (targetSubtab === 'training') {
          this.drawLossChart();
        } else if (targetSubtab === 'simulator') {
          this.renderSimulator();
        }
      });
    });
  },

  // 1. Model Forge
  setupForge: function() {
    const updateCode = () => {
      const name = elements.forgeModelName.value.trim() || 'my-model';
      const baseModel = elements.forgeBaseModel?.value || 'llama3.2:1b';
      const systemPrompt = elements.forgeSystemPrompt.value.trim();
      const temp = elements.forgeParamTemp.value;
      const ctx = elements.forgeParamCtx.value;
      const adapter = elements.forgeAdapterPath.value.trim();

      let lines = [
        `FROM ${baseModel}`,
        `PARAMETER temperature ${temp}`,
        `PARAMETER num_ctx ${ctx}`
      ];
      if (adapter) {
        lines.push(`ADAPTER "${adapter}"`);
      }
      if (systemPrompt) {
        lines.push(`SYSTEM """${systemPrompt}"""`);
      }

      elements.modelfileCode.textContent = lines.join('\n');
      if (window.hljs) {
        window.hljs.highlightElement(elements.modelfileCode);
      }
    };

    elements.forgeModelName.addEventListener('input', updateCode);
    if (elements.forgeBaseModel) elements.forgeBaseModel.addEventListener('change', updateCode);
    elements.forgeSystemPrompt.addEventListener('input', updateCode);
    elements.forgeAdapterPath.addEventListener('input', updateCode);
    elements.forgeParamCtx.addEventListener('change', () => {
      if (elements.forgeValCtx) elements.forgeValCtx.textContent = elements.forgeParamCtx.value;
      updateCode();
    });
    elements.forgeParamTemp.addEventListener('input', () => {
      if (elements.forgeValTemp) elements.forgeValTemp.textContent = elements.forgeParamTemp.value;
      updateCode();
    });

    // Preset chips
    elements.forgePresetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        elements.forgePresetChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const preset = chip.getAttribute('data-preset');
        if (preset === 'coder') {
          elements.forgeSystemPrompt.value = "You are a specialized code generation and refactoring AI. Write clean, idiomatic, error-free code with inline explanations.";
          elements.forgeParamTemp.value = 0.2;
          if (elements.forgeValTemp) elements.forgeValTemp.textContent = '0.2';
          elements.forgeParamCtx.value = '8192';
        } else if (preset === 'reasoner') {
          elements.forgeSystemPrompt.value = "You are an analytical deep-reasoning AI. Always break down complex tasks step-by-step from first principles before providing the final answer.";
          elements.forgeParamTemp.value = 0.6;
          if (elements.forgeValTemp) elements.forgeValTemp.textContent = '0.6';
          elements.forgeParamCtx.value = '4096';
        } else if (preset === 'minimal') {
          elements.forgeSystemPrompt.value = "You are a minimalist, direct AI assistant. Provide concise, ultra-accurate answers with zero conversational fluff or introductory pleasantries.";
          elements.forgeParamTemp.value = 0.3;
          if (elements.forgeValTemp) elements.forgeValTemp.textContent = '0.3';
          elements.forgeParamCtx.value = '2048';
        } else {
          elements.forgeSystemPrompt.value = "";
        }
        updateCode();
      });
    });

    elements.copyModelfileBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(elements.modelfileCode.textContent);
      showToast('Copied Modelfile to clipboard', 'success');
    });

    // Build Model via Ollama /api/create
    elements.buildModelBtn.addEventListener('click', async () => {
      const modelName = elements.forgeModelName.value.trim();
      if (!modelName) {
        showToast('Please specify a model name', 'error');
        return;
      }
      const modelfile = elements.modelfileCode.textContent;

      elements.buildModelBtn.disabled = true;
      elements.terminalStatusPill.className = 'terminal-status-badge building';
      elements.terminalStatusText.textContent = 'Compiling...';
      elements.forgeProgressTrack.classList.remove('hidden');
      elements.forgeProgressBar.style.width = '10%';
      elements.forgeSuccessFooter.classList.add('hidden');
      elements.forgeTerminalStream.innerHTML = `<p class="text-xs text-muted">[${new Date().toLocaleTimeString()}] Sending Modelfile to Ollama /api/create...</p>`;

      try {
        const res = await fetch('/api/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: modelName, modelfile, stream: true })
        });

        if (!res.ok) {
          throw new Error(`Ollama error: HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const chunk = JSON.parse(line);
              if (chunk.status) {
                const logP = document.createElement('p');
                logP.className = 'log-entry text-xs';
                logP.textContent = `[${new Date().toLocaleTimeString()}] ${chunk.status}`;
                elements.forgeTerminalStream.appendChild(logP);
                elements.forgeTerminalStream.scrollTop = elements.forgeTerminalStream.scrollHeight;

                if (chunk.total && chunk.completed) {
                  const pct = Math.min(95, Math.round((chunk.completed / chunk.total) * 100));
                  elements.forgeProgressBar.style.width = `${pct}%`;
                }

                if (chunk.status === 'success') {
                  elements.terminalStatusPill.className = 'terminal-status-badge success';
                  elements.terminalStatusText.textContent = 'Ready';
                  elements.forgeProgressBar.style.width = '100%';
                  elements.forgeSuccessFooter.classList.remove('hidden');
                  showToast(`Model "${modelName}" created successfully!`, 'success');
                  fetchModels();
                }
              }
            } catch (e) {
              console.error(e);
            }
          }
        }
      } catch (err) {
        elements.terminalStatusPill.className = 'terminal-status-badge';
        elements.terminalStatusText.textContent = 'Error';
        const errP = document.createElement('p');
        errP.className = 'log-entry error text-xs';
        errP.textContent = `[${new Date().toLocaleTimeString()}] Error: ${err.message}`;
        elements.forgeTerminalStream.appendChild(errP);
        showToast(`Model creation failed: ${err.message}`, 'error');
      } finally {
        elements.buildModelBtn.disabled = false;
      }
    });

    elements.testNewModelBtn.addEventListener('click', () => {
      const modelName = elements.forgeModelName.value.trim();
      selectAndChat(modelName);
    });

    updateCode();
  },

  // 2. Dataset Studio
  setupDatasets: function() {
    this.loadDatasets();

    elements.datasetSelect.addEventListener('change', (e) => {
      const found = this.datasets.find(d => d.id === e.target.value);
      if (found) {
        this.activeDataset = found;
        this.renderDatasetTable();
      }
    });

    elements.newDatasetBtn.addEventListener('click', () => {
      const name = prompt('Enter a name for the new dataset:', 'Compact Model Reasoning v1');
      if (!name) return;
      const newDs = {
        id: `ds_${Date.now()}`,
        name,
        description: 'Custom fine-tuning dataset',
        format: 'alpaca',
        created_at: new Date().toISOString(),
        pairs: [
          { instruction: 'Explain the function of a transformer attention head.', input: '', output: 'An attention head calculates relevance weights between pairs of tokens in a sequence, allowing the model to focus on contextually related words regardless of their positional distance.' }
        ]
      };
      this.datasets.push(newDs);
      this.activeDataset = newDs;
      this.populateDatasetDropdown();
      this.renderDatasetTable();
      this.saveActiveDataset();
    });

    elements.addPairRowBtn.addEventListener('click', () => {
      if (!this.activeDataset) return;
      this.activeDataset.pairs.push({ instruction: '', input: '', output: '' });
      this.renderDatasetTable();
    });

    elements.saveDatasetChangesBtn.addEventListener('click', () => {
      this.collectTableChanges();
      this.saveActiveDataset();
      showToast('Dataset changes saved!', 'success');
    });

    elements.exportDatasetBtn.addEventListener('click', () => {
      if (!this.activeDataset) return;
      this.collectTableChanges();
      const jsonl = this.activeDataset.pairs.map(p => JSON.stringify(p)).join('\n');
      const blob = new Blob([jsonl], { type: 'application/x-jsonlines' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.activeDataset.id || 'dataset'}.jsonl`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported dataset to JSONL', 'success');
    });

    elements.deleteDatasetBtn.addEventListener('click', async () => {
      if (!this.activeDataset) return;
      if (!confirm(`Delete dataset "${this.activeDataset.name}"?`)) return;
      try {
        await fetch(`/api/datasets/${this.activeDataset.id}`, { method: 'DELETE' });
        showToast('Dataset deleted', 'info');
        this.loadDatasets();
      } catch (e) {
        showToast('Failed to delete dataset', 'error');
      }
    });

    // Distill synthetic data via gemma4:31b
    elements.runDistillBtn.addEventListener('click', async () => {
      const topic = elements.distillTopicInput.value.trim();
      if (!topic) {
        showToast('Please describe the topic or domain for distillation', 'error');
        return;
      }
      const count = parseInt(elements.distillCount.value) || 3;
      elements.runDistillBtn.disabled = true;
      elements.runDistillBtn.innerHTML = `<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> Generating...`;

      showToast(`Generating ${count} synthetic pairs via gemma4:31b...`, 'info');

      try {
        const promptText = `You are an AI teacher creating synthetic training data for training a small compact model.
Generate exactly ${count} diverse, high-quality instruction-response training pairs on the following topic:
Topic: "${topic}"

Output strictly a JSON array without markdown backticks or commentary in this format:
[
  {
    "instruction": "clear question or prompt",
    "input": "",
    "output": "detailed, step-by-step accurate solution or explanation"
  }
]`;

        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemma4:31b',
            prompt: promptText,
            stream: false,
            options: { temperature: 0.7 }
          })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const rawText = data.response.trim();
        
        let cleanedJson = rawText;
        if (cleanedJson.startsWith('```json')) cleanedJson = cleanedJson.replace(/^```json/, '').replace(/```$/, '');
        else if (cleanedJson.startsWith('```')) cleanedJson = cleanedJson.replace(/^```/, '').replace(/```$/, '');

        const parsedPairs = JSON.parse(cleanedJson.trim());
        if (Array.isArray(parsedPairs) && parsedPairs.length > 0) {
          if (!this.activeDataset) {
            this.activeDataset = { id: `ds_${Date.now()}`, name: `Synthetic ${topic}`, pairs: [] };
          }
          parsedPairs.forEach(pair => {
            this.activeDataset.pairs.push({
              instruction: pair.instruction || '',
              input: pair.input || '',
              output: pair.output || ''
            });
          });
          this.renderDatasetTable();
          this.saveActiveDataset();
          showToast(`Generated and added ${parsedPairs.length} pairs!`, 'success');
        } else {
          throw new Error('Invalid JSON format from model');
        }
      } catch (err) {
        showToast(`Distillation failed: ${err.message}`, 'error');
      } finally {
        elements.runDistillBtn.disabled = false;
        elements.runDistillBtn.innerHTML = `<i data-lucide="cpu"></i><span>Generate Pairs</span>`;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  },

  loadDatasets: async function() {
    try {
      const res = await fetch('/api/datasets');
      if (res.ok) {
        this.datasets = await res.json();
        this.populateDatasetDropdown();
        if (this.datasets.length > 0) {
          this.activeDataset = this.datasets[0];
          this.renderDatasetTable();
        }
      }
    } catch (e) {
      console.error(e);
    }
  },

  populateDatasetDropdown: function() {
    elements.datasetSelect.innerHTML = this.datasets.map(d => `
      <option value="${d.id}">${d.name} (${d.pairs?.length || 0} pairs)</option>
    `).join('');
    if (elements.trainDatasetSelect) {
      elements.trainDatasetSelect.innerHTML = elements.datasetSelect.innerHTML;
    }
  },

  renderDatasetTable: function() {
    if (!this.activeDataset) return;
    elements.datasetActiveTitle.textContent = this.activeDataset.name;
    elements.datasetPairCount.textContent = `${this.activeDataset.pairs.length} Pairs`;

    elements.datasetPairsTbody.innerHTML = this.activeDataset.pairs.map((p, idx) => `
      <tr data-row="${idx}">
        <td><strong>${idx + 1}</strong></td>
        <td><textarea class="pair-inst" rows="2">${escapeHtml(p.instruction)}</textarea></td>
        <td><textarea class="pair-out" rows="2">${escapeHtml(p.output)}</textarea></td>
        <td>
          <button class="btn-icon-subtle" onclick="SandboxManager.deletePairRow(${idx})" title="Delete row">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  deletePairRow: function(idx) {
    if (!this.activeDataset) return;
    this.activeDataset.pairs.splice(idx, 1);
    this.renderDatasetTable();
  },

  collectTableChanges: function() {
    if (!this.activeDataset) return;
    const rows = elements.datasetPairsTbody.querySelectorAll('tr');
    this.activeDataset.pairs = Array.from(rows).map(row => ({
      instruction: row.querySelector('.pair-inst').value.trim(),
      input: '',
      output: row.querySelector('.pair-out').value.trim()
    }));
  },

  saveActiveDataset: async function() {
    if (!this.activeDataset) return;
    try {
      await fetch('/api/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.activeDataset)
      });
      this.populateDatasetDropdown();
    } catch (e) {
      console.error(e);
    }
  },

  // 3. Training Lab
  setupTraining: function() {
    elements.startTrainingBtn.addEventListener('click', async () => {
      const modelName = elements.trainTargetName.value.trim() || 'lora-small-model';
      const baseModel = elements.trainBaseModel?.value || 'llama3.2:1b';
      const datasetId = elements.trainDatasetSelect?.value || 'starter_reasoning';
      const epochs = parseInt(elements.trainEpochs.value) || 3;
      const lr = parseFloat(elements.trainLr.value) || 0.0002;
      const rank = parseInt(elements.trainRank.value) || 8;
      const batchSize = parseInt(elements.trainBatchSize.value) || 2;

      elements.startTrainingBtn.classList.add('hidden');
      elements.stopTrainingBtn.classList.remove('hidden');
      elements.trainStatusText.textContent = 'Training...';
      elements.trainingTerminalStream.innerHTML = `<p class="text-xs text-cyan">[${new Date().toLocaleTimeString()}] Spawning LoRA training process (Apple Silicon unified memory)...</p>`;

      try {
        const res = await fetch('/api/training/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modelName, baseModel, datasetId, epochs, lr, rank, batchSize })
        });
        const data = await res.json();
        this.activeTrainingJob = data.job;
        this.pollTrainingJob();
      } catch (err) {
        showToast(`Failed to start training: ${err.message}`, 'error');
        elements.startTrainingBtn.classList.remove('hidden');
        elements.stopTrainingBtn.classList.add('hidden');
      }
    });

    elements.stopTrainingBtn.addEventListener('click', async () => {
      if (!this.activeTrainingJob) return;
      await fetch('/api/training/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: this.activeTrainingJob.id })
      });
      clearInterval(this.trainingInterval);
      elements.startTrainingBtn.classList.remove('hidden');
      elements.stopTrainingBtn.classList.add('hidden');
      elements.trainStatusText.textContent = 'Stopped';
      showToast('Training stopped', 'info');
    });
  },

  pollTrainingJob: function() {
    if (this.trainingInterval) clearInterval(this.trainingInterval);
    this.trainingInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/training/jobs');
        if (!res.ok) return;
        const jobs = await res.json();
        const current = jobs.find(j => j.id === this.activeTrainingJob?.id);
        if (current) {
          this.activeTrainingJob = current;
          elements.monitorLossVal.textContent = current.currentLoss;
          elements.trainStatusText.textContent = current.status === 'completed' ? 'Finished ✅' : (current.status === 'stopped' ? 'Stopped' : 'Running 🔥');
          elements.trainStepText.textContent = `${current.currentStep} / ${current.totalSteps}`;
          elements.trainProgressText.textContent = `${current.progress}%`;

          elements.trainingTerminalStream.innerHTML = current.logs.map(l => `<p class="log-entry text-xs">${escapeHtml(l)}</p>`).join('');
          elements.trainingTerminalStream.scrollTop = elements.trainingTerminalStream.scrollHeight;

          this.drawLossChart(current.lossHistory);

          if (current.status === 'completed' || current.status === 'stopped') {
            clearInterval(this.trainingInterval);
            elements.startTrainingBtn.classList.remove('hidden');
            elements.stopTrainingBtn.classList.add('hidden');
            if (current.status === 'completed') {
              showToast(`Training complete! Loss: ${current.currentLoss}`, 'success');
              elements.forgeAdapterPath.value = `./adapters/${current.modelName}_lora.bin`;
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }, 1200);
  },

  drawLossChart: function(lossHistory = [2.8, 2.5, 2.1, 1.8, 1.4, 1.1, 0.85, 0.65]) {
    const canvas = elements.lossCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let y = 20; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (lossHistory.length < 2) return;

    const maxLoss = Math.max(...lossHistory, 3.0);
    const minLoss = 0.2;
    const stepX = w / (lossHistory.length - 1);

    // Gradient Fill
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
    grad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

    ctx.beginPath();
    ctx.moveTo(0, h);
    lossHistory.forEach((val, i) => {
      const x = i * stepX;
      const y = h - ((val - minLoss) / (maxLoss - minLoss)) * (h - 40) - 20;
      if (i === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line Path
    ctx.beginPath();
    lossHistory.forEach((val, i) => {
      const x = i * stepX;
      const y = h - ((val - minLoss) / (maxLoss - minLoss)) * (h - 40) - 20;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Current point circle
    const lastX = (lossHistory.length - 1) * stepX;
    const lastY = h - ((lossHistory[lossHistory.length - 1] - minLoss) / (maxLoss - minLoss)) * (h - 40) - 20;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;
  },

  // 4. Neural Playground (Visual Micro-Transformer)
  setupSimulator: function() {
    this.simWeights = {
      heads: 2,
      seqLen: 8,
      dModel: 16,
      loss: 2.94,
      attentionMatrix: []
    };

    const initAttention = () => {
      const n = this.simWeights.seqLen;
      this.simWeights.attentionMatrix = Array.from({ length: n }, () =>
        Array.from({ length: n }, () => Math.random())
      );
      // Softmax row normalization
      this.simWeights.attentionMatrix.forEach(row => {
        const sum = row.reduce((a, b) => a + b, 0);
        for (let i = 0; i < row.length; i++) row[i] /= sum;
      });
    };
    initAttention();

    elements.simStepBtn.addEventListener('click', () => {
      this.stepSimulator(1);
    });

    elements.simTrainBtn.addEventListener('click', () => {
      this.stepSimulator(50);
    });

    elements.simResetBtn.addEventListener('click', () => {
      this.simWeights.loss = 2.94;
      initAttention();
      this.renderSimulator();
      showToast('Reset simulator weights', 'info');
    });

    elements.simPromptInput.addEventListener('input', () => {
      this.renderPredictions();
    });

    this.renderSimulator();
  },

  stepSimulator: function(steps = 1) {
    for (let s = 0; s < steps; s++) {
      this.simWeights.loss = Math.max(0.18, parseFloat((this.simWeights.loss * 0.965 - (Math.random() - 0.5) * 0.02).toFixed(4)));
      // Sharpen attention matrix
      this.simWeights.attentionMatrix.forEach((row, i) => {
        row[i] += 0.08 * steps;
        const sum = row.reduce((a, b) => a + b, 0);
        for (let j = 0; j < row.length; j++) row[j] /= sum;
      });
    }
    this.renderSimulator();
  },

  renderSimulator: function() {
    elements.simLossBadge.textContent = `Loss: ${this.simWeights.loss}`;
    this.drawAttentionHeatmap();
    this.renderPredictions();
  },

  drawAttentionHeatmap: function() {
    const canvas = elements.attentionCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const n = this.simWeights.seqLen;
    const cellSize = Math.floor(Math.min(w, h) / n) - 4;
    const offsetX = (w - (cellSize + 4) * n) / 2;
    const offsetY = (h - (cellSize + 4) * n) / 2;

    this.simWeights.attentionMatrix.forEach((row, r) => {
      row.forEach((val, c) => {
        const x = offsetX + c * (cellSize + 4);
        const y = offsetY + r * (cellSize + 4);
        ctx.fillStyle = `rgba(6, 182, 212, ${Math.max(0.08, val)})`;
        ctx.fillRect(x, y, cellSize, cellSize);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeRect(x, y, cellSize, cellSize);
      });
    });
  },

  renderPredictions: function() {
    const prompt = elements.simPromptInput.value || 'def ';
    const candidates = [
      { token: 'calculate', prob: Math.min(85, Math.round(55 + (3 - this.simWeights.loss) * 12)) },
      { token: 'parse_args', prob: Math.min(45, Math.round(20 + (3 - this.simWeights.loss) * 6)) },
      { token: 'main()', prob: Math.min(30, Math.round(15 + (3 - this.simWeights.loss) * 4)) },
      { token: '__init__', prob: Math.min(25, Math.round(10 + (3 - this.simWeights.loss) * 3)) },
      { token: 'validate', prob: Math.min(20, Math.round(8 + (3 - this.simWeights.loss) * 2)) }
    ];

    elements.simProbBars.innerHTML = candidates.map(c => `
      <div class="prob-bar-item">
        <span class="prob-token-name">${c.token}</span>
        <div class="prob-track">
          <div class="prob-fill" style="width: ${c.prob}%;"></div>
        </div>
        <span class="prob-percentage">${c.prob}%</span>
      </div>
    `).join('');
  }
};

window.SandboxManager = SandboxManager;

// ==========================================================================
// App Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) window.lucide.createIcons();
  
  // Initialize Custom Features
  setupPersonaListeners();
  setupTemplateListeners();
  setupImageUploadListeners();
  setupChatControls();
  setupArena();
  setupPullModel();
  SandboxManager.init();
  
  renderPersonaDropdowns();
  
  checkServerStatus();
  fetchModels();

  // Periodic heartbeat poll
  setInterval(() => {
    checkServerStatus();
  }, 8000);
});

