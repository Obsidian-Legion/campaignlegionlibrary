(() => {
  'use strict';
  const form = document.getElementById('corporate-form');
  if (!form) return;
  const recipient = document.getElementById('corporate-recipient').textContent.trim();
  const draft = document.getElementById('corporate-draft');
  const preview = document.getElementById('corporate-preview');
  const mailto = document.getElementById('corporate-mailto');
  const status = document.getElementById('corporate-status');
  const requiredText = ['company', 'contact', 'message'].map(name => form.elements.namedItem(name));

  function validateText() {
    for (const field of requiredText) {
      field.setCustomValidity(field.value.trim() ? '' : 'Please enter a value.');
    }
  }

  form.addEventListener('input', () => {
    validateText();
    if (!draft.hidden) {
      draft.hidden = true;
      preview.value = '';
      mailto.removeAttribute('href');
      status.textContent = 'Details changed. Prepare your request again to update the email.';
    }
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    validateText();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const field = name => String(data.get(name) || '').trim();
    const company = field('company').replace(/[\r\n]+/g, ' ');
    const subject = `Corporate sponsorship inquiry for Gronlid Public Library — ${company}`;
    const body = [
      'Hello Wapiti Regional Library team,',
      '',
      `I am contacting you on behalf of ${company} to discuss corporate support for Gronlid Public Library.`,
      'Please direct this inquiry to the person coordinating support for the Gronlid branch.',
      '',
      `Company: ${company}`,
      `Contact: ${field('contact')}`,
      `Email: ${field('email')}`,
      `Phone: ${field('phone') || 'Not provided'}`,
      `Proposed support: ${field('support')}`,
      `Proposed amount / value: ${field('budget') || 'To be discussed'}`,
      '',
      'Our proposal and questions:',
      field('message').replace(/\r?\n/g, '\r\n'),
      '',
      'Could you let us know the branch’s current needs, whether this support would be useful, and the next steps for discussing an arrangement?',
      '',
      'Thank you,',
      field('contact'),
      company,
    ].join('\r\n');
    preview.value = `To: ${recipient}\r\nSubject: ${subject}\r\n\r\n${body}`;
    mailto.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    draft.hidden = false;
    status.textContent = 'Your request is ready to review. Open the email draft or copy the request to send it.';
    document.getElementById('draft-title').focus({ preventScroll: true });
    draft.scrollIntoView({ block: 'nearest' });
  });

  document.getElementById('corporate-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(preview.value);
      status.textContent = `Request copied. Paste it into an email to ${recipient} and send it from your email app.`;
    } catch {
      preview.focus();
      preview.select();
      status.textContent = 'Select and copy the email preview, then paste it into your email app.';
    }
  });

  form.hidden = false;
})();
