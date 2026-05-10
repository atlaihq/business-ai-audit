/*
 * Business AI Audit — by ATL.AI
 * github.com/atlaihq/business-ai-audit
 *
 * SETUP:
 * 1. Replace YOUR_API_KEY_HERE with your Anthropic API key
 * 2. (Optional) Replace YOUR_APPS_SCRIPT_URL_HERE with your Google Sheets endpoint
 * 3. See README.md for full setup instructions
 *
 * SECURITY:
 * For production, proxy the API call through a backend.
 * Never expose your API key in client-side code.
 */

'use strict';

// ── CONFIG ────────────────────────────────────────────────────────────────────
// ⚠️  Client-side API keys are visible in source. Use a backend proxy in production.
const ANTHROPIC_API_KEY = 'YOUR_API_KEY_HERE';

// TODO: Replace with your Google Apps Script deployment URL
// See /docs/sheets-setup.md for instructions
const SHEETS_URL = 'YOUR_APPS_SCRIPT_URL_HERE';

// ── STATE ─────────────────────────────────────────────────────────────────────
let currentStep = 1;
let selectedUsage  = '';
let selectedTools  = [];
let selectedHelps  = [];   // multi-select for step 3

const answers = {
  businessName:        '',
  businessDescription: '',
  teamSize:            '',
  revenue:             '',
  dailyTasks:          '',
  tools:               '',
  timeLoss:            '',
  aiExperience:        '',
  automationWish:      '',
  bottleneck:          '',
  email:               ''
};

// ── DOM REFS ──────────────────────────────────────────────────────────────────
let reportWrap, reportSubtitle, reportBody, ctaBlock;

// ── INIT ──────────────────────────────────────────────────────────────────────
function init() {
  reportWrap     = document.getElementById('reportWrap');
  reportSubtitle = document.getElementById('reportSubtitle');
  reportBody     = document.getElementById('reportBody');
  ctaBlock       = document.getElementById('ctaBlock');

  document.getElementById('backBtn').addEventListener('click', goBack);

  initStep1();
  initStep2();
  initStep3();
  initStep4();

  showStep(1);
}

// ── NAVIGATION ────────────────────────────────────────────────────────────────
function showStep(n) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById('step' + i);
    if (el) el.hidden = (i !== n);
  }
  currentStep = n;

  document.querySelectorAll('.progress-seg').forEach(function (seg, i) {
    seg.classList.toggle('is-active', i < n);
  });

  document.getElementById('stepNum').textContent = n;
  document.getElementById('backBtn').hidden = (n === 1);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
  if (currentStep > 1) showStep(currentStep - 1);
}

// ── STEP 1 — Use-case cards ───────────────────────────────────────────────────
function initStep1() {
  const cards   = document.querySelectorAll('.use-case-card');
  const nextBtn = document.getElementById('nextBtn1');

  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      cards.forEach(function (c) { c.classList.remove('is-selected'); });
      card.classList.add('is-selected');
      selectedUsage = card.dataset.value;
      nextBtn.disabled = false;
    });
  });

  nextBtn.addEventListener('click', function () {
    if (selectedUsage) showStep(2);
  });
}

// ── STEP 2 — About you ───────────────────────────────────────────────────────
function initStep2() {
  const toolCards = document.querySelectorAll('.tool-icon-card');
  const nextBtn   = document.getElementById('nextBtn2');

  toolCards.forEach(function (card) {
    card.addEventListener('click', function () {
      card.classList.toggle('is-selected');
      const val = card.dataset.value;
      const idx = selectedTools.indexOf(val);
      if (idx > -1) selectedTools.splice(idx, 1);
      else selectedTools.push(val);
    });
  });

  nextBtn.addEventListener('click', function () {
    const uname  = document.getElementById('userName').value.trim();
    const name   = document.getElementById('companyName').value.trim();
    const size   = document.getElementById('companySize').value;
    const goal   = document.getElementById('automationGoal').value.trim();
    const source = document.getElementById('referralSource').value;

    setError('userName',       !uname);
    setError('companyName',    !name);
    setError('automationGoal', !goal);
    setSelectError('companySize',    !size);
    setSelectError('referralSource', !source);

    if (!uname || !name || !size || !goal || !source) return;
    showStep(3);
  });
}

// ── STEP 3 — Service selection (multi-select) ────────────────────────────────
function initStep3() {
  const cards   = document.querySelectorAll('.service-card');
  const nextBtn = document.getElementById('nextBtn3');

  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      card.classList.toggle('is-selected');
      const val = card.dataset.value;
      const idx = selectedHelps.indexOf(val);
      if (idx > -1) selectedHelps.splice(idx, 1);
      else selectedHelps.push(val);
      nextBtn.disabled = selectedHelps.length === 0;
    });
  });

  nextBtn.addEventListener('click', function () {
    if (selectedHelps.length > 0) showStep(4);
  });
}

// ── STEP 4 — Qualifying questions ────────────────────────────────────────────
let selectedHours    = '';
let selectedTimeline = '';
let selectedBudget   = '';

function initStep4() {
  initPillGroup('hoursLostPills',  function (v) { selectedHours    = v; });
  initPillGroup('timelinePills',   function (v) { selectedTimeline = v; });
  initPillGroup('budgetPills',     function (v) { selectedBudget   = v; });

  document.getElementById('submitBtn').addEventListener('click', function () {
    const revenue = document.getElementById('monthlyRevenue').value;

    setSelectError('monthlyRevenue', !revenue);

    if (!revenue || !selectedHours || !selectedTimeline) {
      if (!selectedHours)    markPillGroupError('hoursLostPills');
      if (!selectedTimeline) markPillGroupError('timelinePills');
      return;
    }

    mapAnswers();
    startReportGeneration();
  });
}

function initPillGroup(containerId, onSelect) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.option-pill-sm').forEach(function (btn) {
    btn.addEventListener('click', function () {
      container.querySelectorAll('.option-pill-sm').forEach(function (b) {
        b.classList.remove('is-selected');
      });
      btn.classList.add('is-selected');
      onSelect(btn.dataset.value);
    });
  });
}

function markPillGroupError(containerId) {
  const container = document.getElementById(containerId);
  if (container) container.style.outline = '1.5px solid #ef4444';
  setTimeout(function () {
    if (container) container.style.outline = '';
  }, 1500);
}

// ── VALIDATION HELPERS ────────────────────────────────────────────────────────
function setError(id, hasError) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('is-error', hasError);
}
function setSelectError(id, hasError) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('is-error', hasError);
}

// ── MAP FORM → ANSWERS OBJECT ─────────────────────────────────────────────────
function mapAnswers() {
  const companyName = document.getElementById('companyName').value.trim();
  const userName    = document.getElementById('userName').value.trim();
  const goal        = document.getElementById('automationGoal').value.trim();
  const challenge   = document.getElementById('biggestChallenge')?.value.trim() || '';

  answers.businessName        = companyName;
  const helpStr               = selectedHelps.join(', ') || 'Not specified';
  answers.businessDescription =
    'User: ' + userName + '. Usage: ' + selectedUsage + '. Primary needs: ' + helpStr;
  answers.teamSize            = document.getElementById('companySize').value;
  answers.revenue             = document.getElementById('monthlyRevenue').value;
  answers.dailyTasks          = helpStr;
  answers.tools               = selectedTools.length ? selectedTools.join(', ') : 'Standard tools';
  answers.timeLoss            = selectedHours + ' — ' + challenge;
  answers.aiExperience        = selectedUsage;
  answers.automationWish      = goal;
  answers.bottleneck          = challenge || helpStr;
  answers.email               = '';   // Set this from a form field if you collect email
  // Extra context for API prompt
  answers._timeline           = selectedTimeline;
  answers._budget             = selectedBudget;
  answers._userName           = userName;
}

// ── REPORT GENERATION ─────────────────────────────────────────────────────────
async function startReportGeneration() {
  // Hide onboarding
  document.getElementById('onboarding').hidden   = true;
  document.getElementById('stepProgress').hidden = true;

  // Clear any stale content BEFORE revealing anything
  reportBody.innerHTML = '';
  reportBody.classList.remove('is-visible');
  if (ctaBlock) ctaBlock.setAttribute('hidden', '');

  // Show loading
  const loadingSection = document.getElementById('loadingSection');
  loadingSection.hidden = false;

  // Prepare report area — set content first, then reveal (no flash)
  reportSubtitle.textContent =
    'Personalized for ' + answers.businessName + ' · ' +
    new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  reportBody.innerHTML =
    '<div class="report-loading">' +
      '<div class="report-loading__dots"><span></span><span></span><span></span></div>' +
      '<p>Building your personalized audit...</p>' +
    '</div>';
  reportWrap.removeAttribute('hidden');

  // Cycle status text
  const statusMsgs = ['Analyzing your business...', 'Identifying AI opportunities...', 'Building your report...'];
  let sIdx = 0;
  const statusEl = document.getElementById('loadingStatus');
  const interval = setInterval(function () {
    sIdx = (sIdx + 1) % statusMsgs.length;
    if (statusEl) statusEl.textContent = statusMsgs[sIdx];
  }, 2000);

  try {
    const html = await generateReport();
    clearInterval(interval);

    loadingSection.hidden = true;
    reportBody.innerHTML  = html;
    setTimeout(function () { reportBody.classList.add('is-visible'); }, 50);

    // Show CTA block
    const ctaBlockSub = document.getElementById('ctaBlockSub');
    if (ctaBlockSub) {
      ctaBlockSub.textContent =
        "Let's get on a call and map out exactly what we'd build for " + answers.businessName + '.';
    }
    if (ctaBlock) ctaBlock.removeAttribute('hidden');

    setTimeout(function () {
      reportWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);

    // Optional: save to Google Sheets
    sendToSheets();

  } catch (err) {
    clearInterval(interval);
    loadingSection.hidden = true;
    reportBody.innerHTML =
      '<p style="color:#ef4444;font-size:14px;padding:24px 0">Something went wrong generating your report. Please email us at <a href="mailto:hello@your-domain.com">hello@your-domain.com</a>.</p>';
    reportBody.classList.add('is-visible');
    console.error(err);
  }
}

// ── CLAUDE API CALL (streaming) ───────────────────────────────────────────────
async function generateReport() {
  if (ANTHROPIC_API_KEY === 'YOUR_API_KEY_HERE') {
    await delay(3000);
    return sampleReport();
  }

  const systemPrompt = `You are a business AI audit assistant. Generate a visually rich, deeply personalized AI audit report in HTML. Use ONLY these CSS classes — they are already styled. No markdown, no inline styles.

OUTPUT THIS EXACT HTML STRUCTURE:

<div class="rpt-snapshot"><p class="rpt-snapshot__text">[2 sentences: what the business does + their main challenge, using their actual name]</p><div class="rpt-snapshot__chips"><span class="rpt-chip">👥 [team size]</span><span class="rpt-chip">💰 [monthly revenue]</span><span class="rpt-chip">🎯 [primary need selected]</span><span class="rpt-chip">🛠 [2-3 of their tools]</span></div></div>

<div class="rpt-section"><p class="rpt-label">Top AI Opportunities</p><h3 class="rpt-heading">3 Systems We'd Build for [Business Name]</h3>
<div class="opp-card"><div class="opp-card__rank">01</div><div class="opp-card__content"><div class="opp-card__header"><h4 class="opp-card__title">[Specific system name for their business]</h4><span class="opp-badge opp-badge--green">Saves ~[X] hrs/week</span></div><p class="opp-card__desc">[2-3 sentences referencing their actual tools, tasks, and challenge. Be specific.]</p><div class="opp-metrics"><div class="opp-metric"><span class="opp-metric__label">Impact</span><div class="opp-metric__track"><div class="opp-metric__bar" style="width:[85-95]%"></div></div></div><div class="opp-metric"><span class="opp-metric__label">Speed</span><div class="opp-metric__track"><div class="opp-metric__bar opp-metric__bar--amber" style="width:[65-80]%"></div></div></div></div></div></div>
<div class="opp-card"><div class="opp-card__rank">02</div><div class="opp-card__content"><div class="opp-card__header"><h4 class="opp-card__title">[Second system]</h4><span class="opp-badge opp-badge--blue">[impact]</span></div><p class="opp-card__desc">[Specific description]</p><div class="opp-metrics"><div class="opp-metric"><span class="opp-metric__label">Impact</span><div class="opp-metric__track"><div class="opp-metric__bar" style="width:[75-88]%"></div></div></div><div class="opp-metric"><span class="opp-metric__label">Speed</span><div class="opp-metric__track"><div class="opp-metric__bar opp-metric__bar--green" style="width:[70-82]%"></div></div></div></div></div></div>
<div class="opp-card"><div class="opp-card__rank">03</div><div class="opp-card__content"><div class="opp-card__header"><h4 class="opp-card__title">[Third system]</h4><span class="opp-badge opp-badge--amber">[impact]</span></div><p class="opp-card__desc">[Specific description]</p><div class="opp-metrics"><div class="opp-metric"><span class="opp-metric__label">Impact</span><div class="opp-metric__track"><div class="opp-metric__bar" style="width:[70-82]%"></div></div></div><div class="opp-metric"><span class="opp-metric__label">Speed</span><div class="opp-metric__track"><div class="opp-metric__bar opp-metric__bar--amber" style="width:[55-70]%"></div></div></div></div></div></div>
</div>

<div class="rpt-section"><p class="rpt-label">Estimated Return on Investment</p><div class="roi-grid"><div class="roi-card"><div class="roi-card__num">[X]h</div><div class="roi-card__label">hours saved per week</div><div class="roi-card__sub">Based on [hours lost] reported and team of [size]</div></div><div class="roi-card roi-card--featured"><div class="roi-card__num">$[X]k</div><div class="roi-card__label">annual savings potential</div><div class="roi-card__sub">Projected from [revenue] monthly revenue</div></div><div class="roi-card"><div class="roi-card__num">[X]%</div><div class="roi-card__label">first-year ROI</div><div class="roi-card__sub">On a one-time $697 investment</div></div></div></div>

<div class="rpt-section"><p class="rpt-label">Where to Start</p><div class="first-system-card"><span class="first-system-badge">Recommended First Build →</span><h4 class="first-system-title">[First system name]</h4><p class="first-system-desc">[Why start here, referencing their business specifically]</p><div class="first-system-why"><div class="why-item">[Specific reason 1 for their business]</div><div class="why-item">[Specific reason 2]</div><div class="why-item">[Specific reason 3]</div></div></div></div>

<div class="rpt-section"><p class="rpt-label">Implementation Timeline</p><div class="rpt-timeline"><div class="timeline-step"><div class="timeline-step__week">Week 1–2</div><div class="timeline-step__title">Discovery & Audit</div><div class="timeline-step__desc">[What we map specific to their operations]</div></div><div class="timeline-step"><div class="timeline-step__week">Week 3–4</div><div class="timeline-step__title">Build & Integrate</div><div class="timeline-step__desc">[What we build, mentioning their tools]</div></div><div class="timeline-step"><div class="timeline-step__week">Week 5–6</div><div class="timeline-step__title">Deploy & Train</div><div class="timeline-step__desc">[How we go live with the team]</div></div><div class="timeline-step timeline-step--final"><div class="timeline-step__week">Week 6+</div><div class="timeline-step__title">You Run on AI</div><div class="timeline-step__desc">[Business name] operates with AI infrastructure live 24/7.</div></div></div></div>

Use the exact class names above. Be deeply specific — reference their actual business name, tools, revenue, hours lost, and challenge throughout every section.`;

  const userMessage =
    'Client Name: '        + (answers._userName || 'Unknown')  + '\n' +
    'Business Name: '      + answers.businessName               + '\n' +
    'Description: '        + answers.businessDescription        + '\n' +
    'Team Size: '          + answers.teamSize                   + '\n' +
    'Monthly Revenue: '    + answers.revenue                    + '\n' +
    'Primary Need: '       + answers.dailyTasks                 + '\n' +
    'Tools Used: '         + answers.tools                      + '\n' +
    'Hours Lost / Week: '  + answers.timeLoss                   + '\n' +
    'AI Experience: '      + answers.aiExperience               + '\n' +
    'Wants to Automate: '  + answers.automationWish             + '\n' +
    'Biggest Bottleneck: ' + answers.bottleneck                 + '\n' +
    'Implementation Timeline: ' + (answers._timeline || 'Not specified') + '\n' +
    'Budget Range: '       + (answers._budget || 'Not specified');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-allow-browser': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })
  });

  if (!response.ok) throw new Error('API error ' + response.status);

  const reader  = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let accumulated = '';
  let buffer      = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try {
        const ev = JSON.parse(data);
        if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
          accumulated += ev.delta.text;
        }
      } catch (_) {}
    }
  }

  return accumulated;
}

// ── SAMPLE REPORT (shown when no API key is set) ──────────────────────────────
function sampleReport() {
  return `
<div class="rpt-snapshot">
  <p class="rpt-snapshot__text">Smith Law Group is a real estate closing firm in Atlanta handling buyer and seller transactions. Their main challenge is the volume of manual proposal creation and follow-up that consumes 8+ hours per week.</p>
  <div class="rpt-snapshot__chips">
    <span class="rpt-chip">👥 2–10 people</span>
    <span class="rpt-chip">💰 $15k–$50k / mo</span>
    <span class="rpt-chip">🎯 AI Proposal System</span>
    <span class="rpt-chip">🛠 HubSpot · Sheets · WhatsApp</span>
  </div>
</div>

<div class="rpt-section">
  <p class="rpt-label">Top AI Opportunities</p>
  <h3 class="rpt-heading">3 Systems We'd Build for Smith Law Group</h3>

  <div class="opp-card">
    <div class="opp-card__rank">01</div>
    <div class="opp-card__content">
      <div class="opp-card__header">
        <h4 class="opp-card__title">Automated Proposal & Client Follow-up System</h4>
        <span class="opp-badge opp-badge--green">Saves ~8 hrs/week</span>
      </div>
      <p class="opp-card__desc">Replace manual proposal creation in HubSpot with an AI that generates branded closing documents in seconds, then follows up with buyers and sellers automatically based on deal stage — no team effort required.</p>
      <div class="opp-metrics">
        <div class="opp-metric"><span class="opp-metric__label">Impact</span><div class="opp-metric__track"><div class="opp-metric__bar" style="width:92%"></div></div></div>
        <div class="opp-metric"><span class="opp-metric__label">Speed</span><div class="opp-metric__track"><div class="opp-metric__bar opp-metric__bar--amber" style="width:78%"></div></div></div>
      </div>
    </div>
  </div>

  <div class="opp-card">
    <div class="opp-card__rank">02</div>
    <div class="opp-card__content">
      <div class="opp-card__header">
        <h4 class="opp-card__title">AI Client Support Bot (WhatsApp + Web)</h4>
        <span class="opp-badge opp-badge--blue">Responds 24/7</span>
      </div>
      <p class="opp-card__desc">Deploy an AI trained on your closing processes and FAQs to handle client questions on WhatsApp — answering status updates, document requests, and escalating complex issues to your team automatically.</p>
      <div class="opp-metrics">
        <div class="opp-metric"><span class="opp-metric__label">Impact</span><div class="opp-metric__track"><div class="opp-metric__bar" style="width:84%"></div></div></div>
        <div class="opp-metric"><span class="opp-metric__label">Speed</span><div class="opp-metric__track"><div class="opp-metric__bar opp-metric__bar--green" style="width:74%"></div></div></div>
      </div>
    </div>
  </div>

  <div class="opp-card">
    <div class="opp-card__rank">03</div>
    <div class="opp-card__content">
      <div class="opp-card__header">
        <h4 class="opp-card__title">Automated Weekly Deal Reports</h4>
        <span class="opp-badge opp-badge--amber">Saves ~3 hrs/week</span>
      </div>
      <p class="opp-card__desc">Connect your Google Sheets and HubSpot pipeline data to an AI that generates executive-ready closing reports automatically every week — pipeline status, deal flow, and revenue trends with zero manual work.</p>
      <div class="opp-metrics">
        <div class="opp-metric"><span class="opp-metric__label">Impact</span><div class="opp-metric__track"><div class="opp-metric__bar" style="width:76%"></div></div></div>
        <div class="opp-metric"><span class="opp-metric__label">Speed</span><div class="opp-metric__track"><div class="opp-metric__bar opp-metric__bar--amber" style="width:62%"></div></div></div>
      </div>
    </div>
  </div>
</div>

<div class="rpt-section">
  <p class="rpt-label">Estimated Return on Investment</p>
  <div class="roi-grid">
    <div class="roi-card">
      <div class="roi-card__num">13h</div>
      <div class="roi-card__label">hours saved per week</div>
      <div class="roi-card__sub">Equivalent to ~1/3 of a full-time employee</div>
    </div>
    <div class="roi-card roi-card--featured">
      <div class="roi-card__num">$27k</div>
      <div class="roi-card__label">annual savings potential</div>
      <div class="roi-card__sub">Based on reported revenue and 2–10 person team</div>
    </div>
    <div class="roi-card">
      <div class="roi-card__num">3,773%</div>
      <div class="roi-card__label">first-year ROI</div>
      <div class="roi-card__sub">On a one-time $697 investment</div>
    </div>
  </div>
</div>

<div class="rpt-section">
  <p class="rpt-label">Where to Start</p>
  <div class="first-system-card">
    <span class="first-system-badge">Recommended First Build →</span>
    <h4 class="first-system-title">Automated Proposal & Follow-up System</h4>
    <p class="first-system-desc">Of the three systems, this delivers the fastest ROI for Smith Law Group. Your team already lives in HubSpot — we layer AI on top with no workflow changes required.</p>
    <div class="first-system-why">
      <div class="why-item">Highest immediate revenue impact — closes deals faster without extra headcount</div>
      <div class="why-item">Works natively with HubSpot and Google Sheets you already use daily</div>
      <div class="why-item">Live in 2–3 weeks, ROI-positive within the first month</div>
    </div>
  </div>
</div>

<div class="rpt-section">
  <p class="rpt-label">Implementation Timeline</p>
  <div class="rpt-timeline">
    <div class="timeline-step">
      <div class="timeline-step__week">Week 1–2</div>
      <div class="timeline-step__title">Discovery & Audit</div>
      <div class="timeline-step__desc">We map your proposal workflow, HubSpot configuration, and client communication process in detail.</div>
    </div>
    <div class="timeline-step">
      <div class="timeline-step__week">Week 3–4</div>
      <div class="timeline-step__title">Build & Integrate</div>
      <div class="timeline-step__desc">AI proposal engine built and connected to HubSpot. Automated follow-up sequences configured and thoroughly tested.</div>
    </div>
    <div class="timeline-step">
      <div class="timeline-step__week">Week 5–6</div>
      <div class="timeline-step__title">Deploy & Train</div>
      <div class="timeline-step__desc">System goes live. Your team gets a training session. We monitor and optimize performance in real time.</div>
    </div>
    <div class="timeline-step timeline-step--final">
      <div class="timeline-step__week">Week 6+</div>
      <div class="timeline-step__title">You Run on AI</div>
      <div class="timeline-step__desc">Proposals generate in seconds. Follow-ups run automatically. Your team focuses on closing, not admin work.</div>
    </div>
  </div>
</div>`;
}

// ── GOOGLE SHEETS ─────────────────────────────────────────────────────────────
function sendToSheets() {
  if (SHEETS_URL === 'YOUR_APPS_SCRIPT_URL_HERE') return;
  fetch(SHEETS_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...answers,
      referralSource: document.getElementById('referralSource')?.value || '',
      timestamp: new Date().toISOString(),
      status: 'New'
    })
  }).catch(function () {});
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

document.addEventListener('DOMContentLoaded', init);
