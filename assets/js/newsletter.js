/*
 * Newsletter signup.
 *
 * The form posts the exact same payload to the exact same Shopify endpoint as
 * the footer signup on seekcollective.com (form_type=customer, utf8,
 * contact[tags]=newsletter, contact[email]). With JavaScript off it simply
 * submits and the browser follows Shopify's redirect, which is what the live
 * site does today.
 *
 * This file is progressive enhancement only: it retargets that same submit at
 * a hidden iframe so a visitor on the coming-soon page stays on it. The
 * response is cross-origin, so we cannot read whether Shopify accepted the
 * address — we confirm once the request has been dispatched, exactly as an
 * ordinary cross-origin form post would.
 */
(function () {
  'use strict';

  var form = document.getElementById('footer-newsletter');
  if (!form) return;

  var wrap   = form.closest('.signup');
  var input  = form.querySelector('input[type="email"]');
  var status = form.querySelector('.signup__status');
  if (!wrap || !input || !status) return;

  var TIMEOUT_MS = 6000;
  var settled = false;
  var timer = null;

  // Take over validation messaging now that we can render it ourselves.
  form.noValidate = true;

  var frame = document.createElement('iframe');
  frame.name = 'sc-newsletter-target';
  frame.title = 'Newsletter signup';
  frame.tabIndex = -1;
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText =
    'position:absolute;left:-9999px;top:0;width:0;height:0;border:0;';
  document.body.appendChild(frame);
  form.target = frame.name;

  function say(message, isError) {
    status.textContent = message;
    status.classList.toggle('signup__status--error', Boolean(isError));
  }

  function settle() {
    if (settled) return;
    settled = true;
    clearTimeout(timer);

    wrap.classList.remove('is-busy');
    wrap.classList.add('is-done');
    input.value = '';
    say('Thank you — you’re on the list.', false);
  }

  frame.addEventListener('load', function () {
    // Fires only once a submit has actually navigated the frame.
    if (wrap.classList.contains('is-busy')) settle();
  });

  form.addEventListener('submit', function (event) {
    if (wrap.classList.contains('is-done') ||
        wrap.classList.contains('is-busy')) {
      event.preventDefault();
      return;
    }

    if (!input.value.trim()) {
      event.preventDefault();
      say('Please enter your email address.', true);
      input.focus();
      return;
    }

    if (!input.checkValidity()) {
      event.preventDefault();
      say('Please enter a valid email address.', true);
      input.focus();
      return;
    }

    // Let the native submit run — it lands in the hidden iframe.
    wrap.classList.add('is-busy');
    say('Signing you up…', false);

    // Some browsers withhold the load event when a cross-origin response
    // refuses to render in a frame. The request is already on its way, so
    // confirm regardless.
    timer = setTimeout(settle, TIMEOUT_MS);
  });

  input.addEventListener('input', function () {
    if (status.classList.contains('signup__status--error')) say('', false);
  });
})();
