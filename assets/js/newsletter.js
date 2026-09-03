/*
 * Newsletter signup.
 *
 * The form posts the exact payload the live seekcollective.com footer signup
 * posts, verified against that page's server-rendered HTML:
 *
 *   POST /contact#footer-newsletter
 *     form_type      = customer
 *     utf8           = ✓
 *     contact[tags]  = newsletter
 *     contact[email] = <address>
 *
 * With JavaScript off the form submits natively and the browser follows
 * Shopify's redirect, exactly as the live site does.
 *
 * This file is progressive enhancement: it sends the same body with fetch so
 * the visitor stays on the coming-soon page. The storefront serves
 * `X-Frame-Options: DENY` and `frame-ancestors 'none'`, so a hidden-iframe
 * target can never render the response — fetch in no-cors mode is the honest
 * equivalent and settles as soon as the response lands instead of waiting out
 * a timeout. The response is opaque, so we can confirm that the request was
 * delivered but not what Shopify decided about the address.
 */
(function () {
  'use strict';

  var form = document.getElementById('footer-newsletter');
  if (!form || typeof window.fetch !== 'function') return;

  var wrap   = form.closest('.signup');
  var input  = form.querySelector('input[type="email"]');
  var status = form.querySelector('.signup__status');
  if (!wrap || !input || !status) return;

  var TIMEOUT_MS = 8000;

  // Take over validation messaging now that we can render it ourselves.
  form.noValidate = true;

  function say(message, isError) {
    status.textContent = message;
    status.classList.toggle('signup__status--error', Boolean(isError));
  }

  function done() {
    wrap.classList.remove('is-busy');
    wrap.classList.add('is-done');
    input.value = '';
    say('Thank you — you’re on the list.', false);
  }

  function failed() {
    wrap.classList.remove('is-busy');
    say('Sorry — that didn’t go through. Please try again.', true);
  }

  form.addEventListener('submit', function (event) {
    if (wrap.classList.contains('is-done') || wrap.classList.contains('is-busy')) {
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

    event.preventDefault();
    wrap.classList.add('is-busy');
    say('Signing you up…', false);

    // URLSearchParams carries every field, hidden ones included, and makes
    // fetch set application/x-www-form-urlencoded — a CORS-safelisted request,
    // so it goes straight out with no preflight.
    var body = new URLSearchParams(new FormData(form));

    var settled = false;
    var timer = setTimeout(function () {
      if (!settled) { settled = true; failed(); }
    }, TIMEOUT_MS);

    fetch(form.action, {
      method: 'POST',
      mode: 'no-cors',
      credentials: 'omit',
      body: body
    }).then(function () {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      done();
    }).catch(function () {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      failed();
    });
  });

  input.addEventListener('input', function () {
    if (status.classList.contains('signup__status--error')) say('', false);
  });
})();
