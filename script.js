/* LexiGuard AI — static front-end prototype. No backend, API calls, or API keys. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const state = { findings: [], score: 0, documentName: 'Sample Service Agreement', analyzed: false, template: 'nda', generated: '' };
  let toastTimer;

  const sampleContract = `SERVICE AGREEMENT\n\n1. PAYMENT. The Client shall pay all invoices within 30 days of receipt. Late payments may incur a reasonable fee as stated in the invoice.\n\n2. TERMINATION. The Provider may terminate this agreement at any time for any reason without prior notice. The Client must provide 90 days written notice before termination.\n\n3. LIABILITY. The Provider shall not be liable for any direct, indirect, incidental, special, or consequential damages under any circumstances. The Client accepts all risks associated with the services.\n\n4. CONFIDENTIALITY. Each party agrees to protect confidential information and use it only for the purpose of this agreement.\n\n5. DISPUTES. Any dispute shall be resolved in the Provider's home jurisdiction. The parties waive all rights to appeal.\n\n6. CHANGES. The Provider may change the scope, fees, or terms of this agreement at any time without notifying the Client.`;

  const rules = [
    { id: 'unilateral-termination', category: 'Termination', severity: 'high', title: 'One-sided termination right', patterns: [/terminate.{0,100}(at any time|without prior notice|for any reason)/i, /only the provider.{0,100}terminate/i], explanation: 'The wording may allow one party to end the agreement without a comparable right or a clear notice period.', suggestion: 'Review whether both parties should have balanced termination rights, clear notice periods, and a defined process for outstanding obligations.' },
    { id: 'broad-liability', category: 'Liability', severity: 'high', title: 'Broad limitation or exclusion of liability', patterns: [/not be liable for any.{0,100}(under any circumstances|whatsoever)/i, /exclude.{0,60}all liability/i, /waive.{0,50}all claims/i], explanation: 'The language appears to exclude liability broadly. Its scope and enforceability depend on the agreement and applicable law.', suggestion: 'Ask a qualified reviewer to assess the scope, exceptions, liability cap, and whether exclusions should be mutual.' },
    { id: 'unilateral-change', category: 'Contract changes', severity: 'high', title: 'Unilateral right to change terms', patterns: [/change.{0,70}(terms|fees|scope).{0,70}(without notifying|without notice|at any time)/i, /modify this agreement.{0,60}sole discretion/i], explanation: 'One party may be able to change important terms without advance notice or the other party’s agreement.', suggestion: 'Consider a written amendment process, advance notice, and an option to reject material changes or terminate.' },
    { id: 'dispute-jurisdiction', category: 'Disputes', severity: 'medium', title: 'Dispute forum may favor one party', patterns: [/provider's home jurisdiction/i, /exclusive jurisdiction.{0,80}(provider|seller|company)/i, /waive all rights to appeal/i], explanation: 'The dispute clause may select a forum convenient to one party or waive rights in broad terms.', suggestion: 'Confirm governing law, venue, dispute escalation steps, and whether any waiver is appropriate in the relevant jurisdiction.' },
    { id: 'long-notice', category: 'Termination', severity: 'medium', title: 'Potentially long termination notice', patterns: [/90 days written notice/i, /180 days.{0,30}notice/i, /six months.{0,30}notice/i], explanation: 'A long notice period can limit flexibility if business needs change.', suggestion: 'Check whether the notice period is commercially workable and whether immediate termination is needed for defined serious breaches.' },
    { id: 'late-fees', category: 'Payment', severity: 'medium', title: 'Late payment charges need detail', patterns: [/late payment.{0,80}(fee|penalty|interest)/i, /overdue.{0,80}(fee|interest|penalty)/i], explanation: 'The contract mentions late charges, but the rate, calculation, and applicable limits may need clarification.', suggestion: 'Specify how charges are calculated, when they begin, any grace period, and applicable legal limits.' },
    { id: 'confidentiality-missing', category: 'Confidentiality', severity: 'medium', patterns: [/confidential/i, /non-disclosure/i, /proprietary information/i], title: 'Confidentiality terms may be incomplete', explanation: 'No clear confidentiality language was detected by this simple demo rule. A phrase match cannot confirm that protections are sufficient.', suggestion: 'Consider defining confidential information, permitted use, exclusions, duration, security measures, and return or deletion obligations.', absence: true },
    { id: 'payment-missing', category: 'Payment', severity: 'low', patterns: [/payment/i, /invoice/i, /fees/i, /compensation/i], title: 'Payment terms may need clarification', explanation: 'No obvious payment timing phrase was detected. The demo cannot determine whether payment terms exist elsewhere or are adequate.', suggestion: 'Confirm fees, invoice timing, payment due dates, taxes, expenses, and how disputed invoices are handled.', absence: true }
  ];

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }
  function showToast(message) {
    const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }
  function navigate(viewName) {
    const view = $(`#view-${viewName}`); if (!view) return;
    $$('.view').forEach(section => section.classList.toggle('active', section === view));
    $$('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === viewName));
    const activeNav = $(`.nav-item[data-view="${viewName}"]`);
    $('#breadcrumbCurrent').textContent = activeNav ? activeNav.textContent.trim().replace(/\s+\d+$/, '') : 'Overview';
    $('#sidebar').classList.remove('open'); window.scrollTo({ top: 0, behavior: 'smooth' });
    if (viewName === 'risks') renderRiskDashboard();
  }
  function getSeverityScore(severity) { return severity === 'high' ? 28 : severity === 'medium' ? 16 : 7; }
  function analyzeText() {
    const text = $('#contractText').value.trim();
    const name = $('#contractName').value.trim() || 'Untitled contract';
    if (text.length < 30) { showToast('Add a little more contract text before analyzing.'); $('#contractText').focus(); return; }
    const matches = [];
    rules.forEach(rule => {
      const hit = rule.absence ? !rule.patterns.some(pattern => pattern.test(text)) : rule.patterns.some(pattern => pattern.test(text));
      if (hit) matches.push({ ...rule, severity: rule.severity || 'low' });
    });
    // This is a transparent illustrative score, not a legal risk probability.
    const rawScore = matches.reduce((sum, item) => sum + getSeverityScore(item.severity), 0);
    const score = Math.min(96, Math.max(8, rawScore));
    state.findings = matches; state.score = score; state.documentName = name; state.analyzed = true;
    renderAnalysis(); renderRiskDashboard(); updateStats(); addActivity(name, matches.length);
    showToast(`Demo analysis complete: ${matches.length} finding${matches.length === 1 ? '' : 's'} to review.`);
  }
  function renderAnalysis() {
    $('#emptyAnalysis').classList.add('hidden'); $('#analysisResults').classList.remove('hidden');
    const score = state.score;
    $('#analysisStatus').textContent = `${state.findings.length} demo finding${state.findings.length === 1 ? '' : 's'} generated`;
    $('#overallRiskLabel').textContent = score >= 60 ? 'Higher attention' : score >= 30 ? 'Review recommended' : 'Fewer signals found';
    $('#riskSummary').textContent = score >= 60 ? 'Several phrases may warrant closer review.' : score >= 30 ? 'Some phrases may deserve a second look.' : 'Few phrases matched the demo rules.';
    $('#riskScore').innerHTML = `${score}<span>/100</span>`; $('#riskMeterFill').style.width = `${score}%`;
    $('#riskMeterFill').style.background = score >= 60 ? 'linear-gradient(90deg,#e9bd5e,#d65c64)' : score >= 30 ? 'linear-gradient(90deg,#e8cb74,#e0a947)' : '#4ba487';
    const high = state.findings.filter(x => x.severity === 'high').length;
    const medium = state.findings.filter(x => x.severity === 'medium').length;
    const low = state.findings.filter(x => x.severity === 'low').length;
    $('#findingSummary').innerHTML = `<div class="summary-tile"><strong style="color:#d45e64">${high}</strong><small>High attention</small></div><div class="summary-tile"><strong style="color:#c28a2e">${medium}</strong><small>Review</small></div><div class="summary-tile"><strong style="color:#329b75">${low}</strong><small>Informational</small></div>`;
    $('#findingsList').innerHTML = state.findings.length ? state.findings.slice(0, 4).map((finding, index) => findingCard(finding, index, false)).join('') : '<div class="empty-inline">No phrases matched the current demo rules. That does not mean the contract is safe or legally complete.</div>';
  }
  function severityLabel(severity) { return severity === 'high' ? 'High attention' : severity === 'medium' ? 'Review' : 'Informational'; }
  function findingCard(finding, index, expanded) {
    return `<article class="${expanded ? 'dashboard-finding' : 'finding-card'}"><span class="${expanded ? 'finding-number' : 'finding-category'}">${expanded ? String(index + 1).padStart(2, '0') : escapeHTML(finding.category)}</span><div class="finding-main"><div class="finding-top"><span class="${expanded ? 'finding-category' : ''}">${expanded ? escapeHTML(finding.category) : ''}</span><span class="risk-badge risk-${finding.severity}">${severityLabel(finding.severity)}</span></div><h4>${escapeHTML(finding.title)}</h4><p>${escapeHTML(finding.explanation)}</p><p class="finding-suggestion"><strong>Suggested review:</strong> ${escapeHTML(finding.suggestion)}</p></div></article>`;
  }
  function renderRiskDashboard() {
    $('#riskDocumentName').textContent = state.analyzed ? state.documentName : 'Sample Service Agreement';
    $('#riskDocumentMeta').textContent = state.analyzed ? `${state.findings.length} rule-based demo findings · Not a legal opinion` : 'Illustrative sample · Run an analysis to replace these results';
    const score = state.analyzed ? state.score : 72;
    $('#dashboardScore').textContent = score;
    $('#scoreRing').style.background = `conic-gradient(${score >= 60 ? '#d65e64' : score >= 30 ? '#e1ac48' : '#4ba487'} 0deg ${score * 3.6}deg,#f0f2f4 ${score * 3.6}deg 360deg)`;
    const badge = $('#dashboardRiskBadge'); badge.className = `risk-badge ${score >= 60 ? 'risk-high' : score >= 30 ? 'risk-medium' : 'risk-low'}`; badge.textContent = score >= 60 ? 'High attention' : score >= 30 ? 'Review' : 'Lower signal count';
    $('#dashboardScoreCaption').textContent = state.analyzed ? 'Illustrative score from phrase matches only.' : 'Sample score shown for demonstration.';
    const findings = state.analyzed ? state.findings : rules.filter(rule => ['unilateral-termination', 'broad-liability', 'unilateral-change', 'dispute-jurisdiction'].includes(rule.id));
    $('#riskFindingCount').textContent = `${findings.length} ${state.analyzed ? 'demo' : 'sample'} finding${findings.length === 1 ? '' : 's'} · Filter to inspect categories`;
    renderCategoryBars(findings);
    const filter = $('#riskFilter').value;
    const filtered = filter === 'all' ? findings : findings.filter(item => item.severity === filter);
    $('#dashboardFindings').innerHTML = filtered.length ? filtered.map((finding, index) => findingCard(finding, index, true)).join('') : '<div class="empty-inline">No findings in this filter.</div>';
  }
  function renderCategoryBars(findings) {
    const counts = {};
    findings.forEach(item => { counts[item.category] = (counts[item.category] || 0) + 1; });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (!entries.length) { $('#categoryBars').innerHTML = '<p class="muted">No findings to chart yet.</p>'; return; }
    const max = Math.max(...entries.map(entry => entry[1]), 1);
    $('#categoryBars').innerHTML = entries.slice(0, 6).map(([name, count]) => `<div class="category-row"><span>${escapeHTML(name)}</span><div class="category-track"><div class="category-fill ${name === 'Liability' ? 'high' : name === 'Confidentiality' ? 'low' : ''}" style="width:${Math.max(10, count / max * 100)}%"></div></div><strong>${count}</strong></div>`).join('');
  }
  function updateStats() {
    $('#statReviewed').textContent = '13'; $('#statFlagged').textContent = String(state.findings.length).padStart(2, '0');
    $('#statHigh').textContent = String(state.findings.filter(x => x.severity === 'high').length).padStart(2, '0');
  }
  function addActivity(name, count) {
    const item = document.createElement('div'); item.className = 'activity-item';
    const severity = state.score >= 60 ? 'high' : state.score >= 30 ? 'medium' : 'low';
    item.innerHTML = `<span class="activity-file">▤</span><div class="activity-copy"><strong>${escapeHTML(name)}</strong><small>Contract analysis demo · Just now · ${count} findings</small></div><span class="risk-badge risk-${severity}">${severity === 'high' ? 'High risk' : severity === 'medium' ? 'Review' : 'Low signal'}</span>`;
    $('#activityList').prepend(item); while ($('#activityList').children.length > 4) $('#activityList').lastElementChild.remove();
  }

  const answers = [
    { keys: ['indemnity', 'indemnify'], answer: 'An indemnity clause describes when one party may have to cover certain losses, claims, or costs suffered by the other. The scope matters: look for which claims are covered, exclusions, notice and defense procedures, caps, and whether the obligation is mutual. The effect depends on the exact wording and applicable law.' },
    { keys: ['termination', 'terminate', 'notice period'], answer: 'A termination clause explains how an agreement can end. Review who may terminate, whether notice is required, whether a party can terminate for breach, whether there is time to fix a breach, and what happens to fees, data, work in progress, and confidentiality after termination.' },
    { keys: ['limitation of liability', 'liability', 'liable', 'damages'], answer: 'A limitation-of-liability clause sets boundaries around certain losses or damages a party may owe. Common points to review include the cap, excluded types of loss, exceptions (which vary by law), whether the terms apply to both parties, and whether the cap matches the risks of the deal.' },
    { keys: ['nda', 'non-disclosure', 'confidentiality', 'confidential'], answer: 'A non-disclosure agreement (NDA) sets rules for handling specified confidential information. Common elements include what counts as confidential, allowed use, permitted disclosures, exclusions for public or independently developed information, duration, security, and what happens when the relationship ends.' },
    { keys: ['governing law', 'jurisdiction', 'dispute', 'arbitration'], answer: 'Dispute-resolution terms may identify the governing law, courts or arbitration forum, location, process, and any escalation steps. These choices can affect cost and convenience. Their legal effect depends on the parties, contract, and relevant jurisdiction, so a qualified professional should review them.' },
    { keys: ['payment', 'invoice', 'late fee', 'interest'], answer: 'Payment terms are clearer when they specify fees, invoice requirements, due dates, taxes, reimbursable expenses, disputed invoices, late charges, and any grace period. Check that any charge is clearly described and permitted under applicable law.' },
    { keys: ['privacy', 'personal data', 'data protection'], answer: 'If a contract involves personal data, review what data is handled, each party’s role, permitted purposes, security measures, incident notice, retention and deletion, subprocessors, cross-border transfers, and any required data-processing terms. The specific requirements depend on applicable privacy laws.' },
    { keys: ['hello', 'hi', 'hey'], answer: 'Hello! I can help explain common contract concepts such as indemnity, termination, liability, confidentiality, payment, and dispute resolution. Ask a general question, and I’ll share a short educational overview.' }
  ];
  function getAnswer(question) {
    const normalized = question.toLowerCase();
    const match = answers.find(item => item.keys.some(key => normalized.includes(key)));
    if (match) return match.answer;
    return 'I don’t have a specific built-in explanation for that question in this demo. You can try asking about indemnity, termination, limitation of liability, NDAs, payment terms, privacy, or dispute resolution. For advice about a real situation, speak with a qualified lawyer in the relevant jurisdiction.';
  }
  function appendMessage(text, who) {
    const wrapper = document.createElement('div'); wrapper.className = `message ${who === 'user' ? 'user-message' : 'assistant-message'}`;
    const avatar = document.createElement('div'); avatar.className = 'message-avatar'; avatar.textContent = who === 'user' ? 'YOU' : 'LG';
    const body = document.createElement('div'); body.className = 'message-body';
    const author = document.createElement('span'); author.className = 'message-author'; author.textContent = who === 'user' ? 'You' : 'LexiGuard';
    if (who !== 'user') { const label = document.createElement('small'); label.textContent = 'DEMO'; author.appendChild(label); }
    const bubble = document.createElement('div'); bubble.className = 'message-bubble'; bubble.textContent = text;
    if (who !== 'user') { bubble.appendChild(document.createElement('br')); bubble.appendChild(document.createElement('br')); const caveat = document.createElement('span'); caveat.className = 'answer-caveat'; caveat.textContent = 'General information only — not legal advice.'; bubble.appendChild(caveat); }
    body.append(author, bubble); wrapper.append(avatar, body); $('#chatMessages').appendChild(wrapper); $('#chatMessages').scrollTop = $('#chatMessages').scrollHeight;
  }
  function sendQuestion(question) {
    const clean = question.trim(); if (!clean) return;
    appendMessage(clean, 'user'); appendMessage(getAnswer(clean), 'assistant');
    const item = document.createElement('div'); item.className = 'activity-item'; item.innerHTML = '<span class="activity-file">✳</span><div class="activity-copy"><strong>Legal assistant question</strong><small>Built-in demo response · Just now</small></div><span class="risk-badge risk-medium">Answered</span>';
    $('#activityList').prepend(item); while ($('#activityList').children.length > 4) $('#activityList').lastElementChild.remove();
  }

  function buildDocument() {
    const partyOne = $('#partyOne').value.trim() || '[First Party]';
    const partyTwo = $('#partyTwo').value.trim() || '[Second Party]';
    const date = $('#effectiveDate').value || '[Effective Date]';
    const duration = $('#duration').value.trim() || '[Duration / Term]';
    const purpose = $('#purpose').value.trim() || '[Describe the purpose or scope]';
    if (state.template === 'nda') {
      return `MUTUAL NON-DISCLOSURE AGREEMENT\n\nThis illustrative draft is made effective on ${date} (the “Effective Date”) by and between ${partyOne} and ${partyTwo} (each a “Party” and together the “Parties”).\n\n1. PURPOSE\nThe Parties wish to discuss or evaluate the following purpose: ${purpose}. In doing so, either Party may disclose information it considers confidential.\n\n2. CONFIDENTIAL INFORMATION\n“Confidential Information” means non-public information disclosed by or on behalf of a Party that is identified as confidential or that reasonably should be understood to be confidential in the circumstances. The Parties should define any exclusions and required marking procedures in the final agreement.\n\n3. PERMITTED USE AND PROTECTION\nEach receiving Party will use Confidential Information only for the stated purpose and take reasonable steps to protect it. Disclosure should be limited to people who need the information for that purpose and are subject to suitable confidentiality obligations.\n\n4. EXCLUSIONS AND REQUIRED DISCLOSURE\nThe final agreement should address information that is public, already lawfully known, independently developed, or lawfully received from another source, and disclosures required by law.\n\n5. TERM\nThe intended term is ${duration}. The Parties should specify when confidentiality obligations begin and how long they continue, including after this agreement ends.\n\n6. RETURN OR DELETION\nUpon written request or the end of discussions, the receiving Party should return or delete Confidential Information, subject to any agreed retention exceptions or legal requirements.\n\n7. GENERAL\nThe Parties should add appropriate governing law, remedies, notices, permitted disclosures, and other terms after legal review. Any amendment should be in writing and agreed by both Parties.\n\nSIGNATURES\n\n${partyOne}\nName / Title: __________________________\nSignature: _____________________________\nDate: __________________________________\n\n${partyTwo}\nName / Title: __________________________\nSignature: _____________________________\nDate: __________________________________\n\nIMPORTANT: This is a general illustrative template, not legal advice or a jurisdiction-specific legal form. Have a qualified lawyer review and adapt it before use.`;
    }
    return `SERVICE AGREEMENT — STARTER DRAFT\n\nThis illustrative draft is made effective on ${date} between ${partyOne} (“Client”) and ${partyTwo} (“Service Provider”).\n\n1. SCOPE OF SERVICES\nThe Service Provider will provide the following services: ${purpose}. Deliverables, milestones, acceptance criteria, and dependencies should be documented in a schedule.\n\n2. TERM\nThe intended term is ${duration}, beginning on the Effective Date unless the Parties agree otherwise in writing.\n\n3. FEES AND PAYMENT\nThe fees, invoice frequency, payment deadline, taxes, approved expenses, and process for disputing invoices must be specified in the final agreement. Do not leave material pricing terms ambiguous.\n\n4. RESPONSIBILITIES\nEach Party will appoint a contact and provide information and cooperation reasonably needed to perform its obligations. Any assumptions or client dependencies should be recorded.\n\n5. CONFIDENTIALITY AND DATA\nEach Party will protect confidential information as agreed by the Parties. If personal data is processed, the Parties should add appropriate privacy and data-processing terms.\n\n6. INTELLECTUAL PROPERTY\nThe Parties must specify ownership and permitted use of pre-existing materials, deliverables, third-party materials, and any licences granted.\n\n7. TERM AND TERMINATION\nThe final agreement should set out termination rights, notice periods, any cure period for breach, payment for completed work, and obligations that survive termination.\n\n8. LIABILITY AND DISPUTES\nThe Parties should negotiate appropriate liability allocation, exceptions, caps, governing law, and dispute-resolution procedures with qualified legal advice.\n\n9. GENERAL\nAmendments should be in writing and agreed by both Parties. Add complete notice details, signatures, and any required schedules before execution.\n\nSIGNATURES\n\nCLIENT: ${partyOne}\nName / Title: __________________________\nSignature: _____________________________\nDate: __________________________________\n\nSERVICE PROVIDER: ${partyTwo}\nName / Title: __________________________\nSignature: _____________________________\nDate: __________________________________\n\nIMPORTANT: This is a general illustrative template, not legal advice or a jurisdiction-specific legal form. Have a qualified lawyer review and adapt it before use.`;
  }
  function downloadText(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }
  function updateCharCount() { $('#charCount').textContent = `${$('#contractText').value.length.toLocaleString()} characters`; }

  // Navigation and common actions
  $$('.nav-item').forEach(button => button.addEventListener('click', () => navigate(button.dataset.view)));
  $$('[data-go]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.go)));
  $('#mobileMenu').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
  $('#helpButton').addEventListener('click', () => $('#helpDialog').showModal());
  $('#closeHelp').addEventListener('click', () => $('#helpDialog').close());
  $('#ackHelp').addEventListener('click', () => $('#helpDialog').close());
  $('#loadSample').addEventListener('click', () => { $('#contractText').value = sampleContract; $('#contractName').value = 'Sample Service Agreement'; updateCharCount(); showToast('Sample contract loaded.'); });
  $('#textFile').addEventListener('change', async event => {
    const file = event.target.files && event.target.files[0]; if (!file) return;
    if (!file.name.toLowerCase().endsWith('.txt') && file.type !== 'text/plain') { showToast('Please choose a plain-text .txt file.'); event.target.value = ''; return; }
    if (file.size > 1024 * 1024) { showToast('For this demo, keep text files under 1 MB.'); event.target.value = ''; return; }
    try { $('#contractText').value = await file.text(); $('#contractName').value = file.name.replace(/\.txt$/i, '').slice(0, 100); updateCharCount(); showToast('Text loaded locally in your browser.'); }
    catch { showToast('Could not read that file. Try another .txt file.'); }
  });
  $('#contractText').addEventListener('input', updateCharCount);
  $('#analyzeButton').addEventListener('click', analyzeText); $('#analyzeEmpty').addEventListener('click', analyzeText);
  $('#openRiskDashboard').addEventListener('click', () => navigate('risks'));
  $('#riskFilter').addEventListener('change', renderRiskDashboard);
  $('#chatForm').addEventListener('submit', event => { event.preventDefault(); const input = $('#chatInput'); sendQuestion(input.value); input.value = ''; input.focus(); });
  $$('.topic-chip').forEach(button => button.addEventListener('click', () => sendQuestion(button.dataset.prompt)));
  $('#clearChat').addEventListener('click', () => { $('#chatMessages').innerHTML = ''; appendMessage('Chat cleared. Ask a general question about a contract concept to get started.', 'assistant'); showToast('Chat cleared.'); });
  $$('.template-option').forEach(button => button.addEventListener('click', () => {
    state.template = button.dataset.template; $$('.template-option').forEach(option => { option.classList.toggle('selected', option === button); $('.template-radio', option).textContent = option === button ? '●' : '○'; });
    if (!$('#generatedWrap').classList.contains('hidden')) { $('#generatedWrap').classList.add('hidden'); $('#templateForm').classList.remove('hidden'); }
  }));
  $('#templateForm').addEventListener('submit', event => { event.preventDefault(); state.generated = buildDocument(); $('#generatedDocument').value = state.generated; $('#generatedWrap').classList.remove('hidden'); $('#templateForm').classList.add('hidden'); showToast('Starter document generated.'); });
  $('#editDraft').addEventListener('click', () => { $('#templateForm').classList.remove('hidden'); $('#generatedWrap').classList.add('hidden'); });
  $('#downloadDraft').addEventListener('click', () => {
    const base = ($('#partyOne').value.trim() || 'LexiGuard').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '').slice(0, 45) || 'LexiGuard';
    downloadText(`${base}-${state.template === 'nda' ? 'mutual-nda' : 'service-agreement'}.txt`, $('#generatedDocument').value);
    showToast('Draft downloaded as a text file.');
  });
  $('#templateForm').addEventListener('reset', () => { state.generated = ''; });

  updateCharCount();
  // Keep the date input convenient without assuming a specific locale format.
  const today = new Date(); $('#effectiveDate').value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  // Demo starts with illustrative sample findings so the dashboard isn't empty.
  state.findings = rules.filter(rule => ['unilateral-termination', 'broad-liability', 'unilateral-change', 'dispute-jurisdiction'].includes(rule.id));
  state.score = 72; state.analyzed = false; renderRiskDashboard();
})();
