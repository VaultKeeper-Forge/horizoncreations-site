(() => {
  const config = window.VAULT_COMPILER_CONFIG;
  const app = document.querySelector('#pilot-app');
  if (!config || !app) return;

  const apiBase = config.requestEndpoint.replace(/\/api\/vault-requests$/, '');
  const stages = [...app.querySelectorAll('[data-stage]')];
  const progress = [...app.querySelectorAll('[data-progress]')];
  const accessForm = document.querySelector('#pilot-access-form');
  const intakeForm = document.querySelector('#pilot-intake-form');
  const accessStatus = document.querySelector('#pilot-access-status');
  const intakeStatus = document.querySelector('#pilot-intake-status');
  const reviewStatus = document.querySelector('#pilot-review-status');
  const codeInput = document.querySelector('#pilot-code');
  const guidedPanel = document.querySelector('#guided-panel');
  const existingPanel = document.querySelector('#existing-panel');
  const waitlistForm = document.querySelector('#waitlist-form');
  const waitlistStatus = document.querySelector('#waitlist-status');
  const waitlistSuccess = document.querySelector('#waitlist-success');
  const waitlistWish = document.querySelector('#waitlist-wish');
  const waitlistWishCount = document.querySelector('#waitlist-wish-count');
  let accessToken = '';
  let method = 'guided';
  let normalized = null;
  let pendingPayload = null;
  let receiptToken = '';
  let receivedRequestId = '';

  const show = (name) => {
    stages.forEach((stage) => { stage.hidden = stage.dataset.stage !== name; });
    const order = ['access', 'intake', 'review', 'received'];
    const active = order.indexOf(name);
    progress.forEach((item, index) => {
      item.classList.toggle('is-current', index === active);
      item.classList.toggle('is-complete', index < active);
    });
    app.querySelector(`[data-stage="${name}"]`)?.focus?.({ preventScroll: true });
  };

  const setStatus = (element, message, isError = false) => {
    element.textContent = message;
    element.classList.toggle('is-error', isError);
  };

  const requestJson = async (path, payload) => {
    const response = await fetch(`${apiBase}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.message || 'The request could not be completed. Nothing was submitted.');
    return data;
  };

  const personality = () => {
    const data = new FormData(intakeForm);
    return {
      feel: String(data.get('feel') || ''),
      directness: String(data.get('directness') || ''),
      humor: String(data.get('humor') || ''),
      answer_depth: String(data.get('answer_depth') || ''),
      formality: String(data.get('formality') || ''),
      sarcasm: data.get('sarcasm') === 'on',
      profanity: data.get('profanity') === 'on',
      teasing: data.get('teasing') === 'on',
      challenge: data.get('challenge') === 'on',
      avoid: String(data.get('avoid') || ''),
      inspiration: String(data.get('inspiration') || ''),
      existing_sample: String(data.get('existing_sample') || ''),
    };
  };

  const buildPayload = () => {
    const payload = {
      pilot_access_token: accessToken,
      intake_method: method,
      contact: {
        name: document.querySelector('#request-name').value.slice(0, 100),
        email: document.querySelector('#request-email').value.slice(0, 254),
      },
      personality: personality(),
      website: '',
    };
    if (method === 'guided') {
      payload.guided_answers = {};
      document.querySelectorAll('[data-question]').forEach((field) => { payload.guided_answers[field.dataset.question] = field.value.slice(0, 2400); });
    } else {
      payload.source_text = document.querySelector('#existing-text').value.slice(0, 20000);
      payload.source_type = document.querySelector('#existing-file').dataset.sourceType || 'pasted_text';
    }
    return payload;
  };

  const renderReview = (record, personalityPreview) => {
    const review = record.review;
    const cards = [
      ['Useful answers found', review.useful_answers_found.length],
      ['Need clarification', review.needs_clarification.length],
      ['Conflicts detected', review.conflicts_detected.length],
      ['Can wait', review.can_wait.length],
    ];
    document.querySelector('#review-summary').replaceChildren(...cards.map(([label, count]) => {
      const card = document.createElement('div');
      const strong = document.createElement('strong');
      const span = document.createElement('span');
      strong.textContent = String(count);
      span.textContent = label;
      card.append(strong, span);
      return card;
    }));
    document.querySelector('#canonical-list').replaceChildren(...record.answers.map((answer) => {
      const row = document.createElement('article');
      const heading = document.createElement('strong');
      const status = document.createElement('span');
      const value = document.createElement('p');
      heading.textContent = answer.question_id;
      status.textContent = answer.status.replaceAll('_', ' ');
      status.className = `answer-status status-${answer.status.toLowerCase()}`;
      value.textContent = answer.answer || 'Not provided yet.';
      row.append(heading, status, value);
      return row;
    }));
    document.querySelector('#personality-preview').textContent = personalityPreview;
  };

  accessForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!accessForm.reportValidity()) return;
    const submit = document.querySelector('#pilot-access-submit');
    submit.disabled = true;
    setStatus(accessStatus, 'Checking pilot access…');
    try {
      const result = await requestJson('/api/pilot-access', {
        invite_code: codeInput.value.slice(0, 20),
        website: document.querySelector('#pilot-website').value.slice(0, 200),
      });
      accessToken = result.pilot_access_token;
      codeInput.value = '';
      setStatus(accessStatus, '');
      show('intake');
    } catch (error) {
      codeInput.value = '';
      setStatus(accessStatus, error.message, true);
    } finally {
      submit.disabled = false;
    }
  });

  const updateWaitlistWishCount = () => {
    if (waitlistWish && waitlistWishCount) waitlistWishCount.textContent = `${waitlistWish.value.length} / 500`;
  };
  waitlistWish?.addEventListener('input', updateWaitlistWishCount);
  updateWaitlistWishCount();

  waitlistForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!waitlistForm.reportValidity()) return;
    const submit = document.querySelector('#waitlist-submit');
    submit.disabled = true;
    setStatus(waitlistStatus, 'Adding you to the waitlist…');
    try {
      const data = new FormData(waitlistForm);
      const result = await requestJson('/api/waitlist', {
        email: String(data.get('email') || '').slice(0, 254),
        assistant_wish: String(data.get('assistant_wish') || '').slice(0, 500),
        consent: data.get('consent') === 'on',
        website: String(data.get('website') || '').slice(0, 200),
        source_page: window.location.href.split('#')[0].split('?')[0],
        source_version: config.sourceVersion,
      });
      waitlistForm.reset();
      updateWaitlistWishCount();
      waitlistForm.hidden = true;
      document.querySelector('#waitlist-success-message').textContent = result.message;
      setStatus(waitlistStatus, '');
      waitlistSuccess.hidden = false;
      waitlistSuccess.focus();
    } catch (error) {
      setStatus(waitlistStatus, error.message, true);
      submit.disabled = false;
    }
  });

  const syncIntakePath = () => {
    const guidedActive = method === 'guided';
    const existingActive = method === 'bring_existing';
    guidedPanel.hidden = !guidedActive;
    existingPanel.hidden = !existingActive;
    guidedPanel.querySelectorAll('input, textarea, select, button').forEach((control) => { control.disabled = !guidedActive; });
    existingPanel.querySelectorAll('input, textarea, select, button').forEach((control) => { control.disabled = !existingActive; });
  };

  document.querySelectorAll('[data-path]').forEach((button) => button.addEventListener('click', () => {
    method = button.dataset.path;
    document.querySelectorAll('[data-path]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    syncIntakePath();
  }));
  syncIntakePath();

  document.querySelector('#existing-file').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 20000 || !/\.(txt|md|json)$/i.test(file.name)) {
      event.target.value = '';
      setStatus(intakeStatus, 'Use a TXT, Markdown, or JSON file no larger than 20 KB.', true);
      return;
    }
    const text = await file.text();
    document.querySelector('#existing-text').value = text.slice(0, 20000);
    event.target.dataset.sourceType = file.name.toLowerCase().endsWith('.json') ? 'json' : file.name.toLowerCase().endsWith('.md') ? 'markdown' : 'text_document';
    setStatus(intakeStatus, 'Document text loaded. Review it below before continuing.');
  });

  intakeForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!intakeForm.reportValidity()) return;
    if (method === 'bring_existing' && document.querySelector('#existing-text').value.trim().length < 20) {
      setStatus(intakeStatus, 'Paste or load a little more of the existing material.', true);
      return;
    }
    const submit = document.querySelector('#pilot-review-submit');
    submit.disabled = true;
    setStatus(intakeStatus, 'Mapping your answers into one reviewable intake…');
    try {
      pendingPayload = buildPayload();
      normalized = await requestJson('/api/intake/normalize', pendingPayload);
      renderReview(normalized.canonical_record, normalized.personality_preview);
      setStatus(intakeStatus, '');
      setStatus(reviewStatus, normalized.canonical_record.review.conflicts_detected.length ? 'Resolve conflicts before creating the request.' : 'Review the mapped answers, then create the request when they look right.', normalized.canonical_record.review.conflicts_detected.length > 0);
      document.querySelector('#pilot-create').disabled = !normalized.canonical_record.review.ready_for_request;
      show('review');
    } catch (error) {
      setStatus(intakeStatus, error.message, true);
    } finally {
      submit.disabled = false;
    }
  });

  document.querySelector('#pilot-edit').addEventListener('click', () => show('intake'));
  document.querySelector('#pilot-create').addEventListener('click', async () => {
    if (!document.querySelector('#request-consent').checked) {
      setStatus(reviewStatus, 'Please confirm the human-review and contact step.', true);
      return;
    }
    const button = document.querySelector('#pilot-create');
    button.disabled = true;
    setStatus(reviewStatus, 'Creating your private canonical request…');
    try {
      const result = await requestJson('/api/vault-requests', { ...pendingPayload, consent: true });
      accessToken = '';
      receiptToken = result.receipt_token;
      receivedRequestId = result.request_id;
      pendingPayload = null;
      normalized = null;
      document.querySelector('#request-success-message').textContent = result.message;
      document.querySelector('#request-id').textContent = result.request_id;
      document.querySelector('#package-ready').hidden = !result.package_ready;
      setStatus(reviewStatus, '');
      show('received');
      document.querySelector('[data-stage="received"]').focus();
    } catch (error) {
      setStatus(reviewStatus, error.message, true);
      button.disabled = false;
    }
  });

  document.querySelector('#package-download').addEventListener('click', async () => {
    const button = document.querySelector('#package-download');
    const status = document.querySelector('#package-status');
    if (!receiptToken || !receivedRequestId) return;
    button.disabled = true;
    setStatus(status, 'Assembling the deterministic Starter Vault ZIP…');
    try {
      const response = await fetch(`${apiBase}/api/vault-requests/package`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: receivedRequestId, receipt_token: receiptToken }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'The Starter Vault package is not ready.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Vault-Compiler-${receivedRequestId}.zip`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus(status, 'Fictional Starter Vault downloaded.');
      receiptToken = '';
    } catch (error) {
      setStatus(status, error.message, true);
      button.disabled = false;
    }
  });
})();
