/*
 * Newsletter signup.
 *
 * Posts to Klaviyo's client subscription endpoint, which is CORS-enabled and
 * built for exactly this: a static page on a different origin subscribing an
 * address without a server or a secret. `company_id` is Klaviyo's public key,
 * so it is safe in client source.
 *
 * Why not Shopify's /contact, which is what the live seekcollective.com
 * footer uses: a HAR of a real signup there shows the submission also carries
 * an `h-captcha-response` token and a session-bound `form_key`, alongside the
 * store's cookies. Shopify's spam protection mints that token on the
 * storefront itself, so it cannot be produced from this origin — and Shopify
 * varies its response on Sec-Fetch-Site. A cross-origin post from here would
 * be dropped, silently, with no way for this page to tell.
 *
 * The <form> still carries Shopify's action and hidden fields so that with
 * JavaScript off it submits natively and the visitor lands on the real store,
 * which is the best available no-JS outcome.
 */
(function () {
  'use strict';

  var COMPANY_ID = 'Jk4WSL';   // Klaviyo public key
  var LIST_ID    = 'Laz5ER';   // newsletter list
  var REVISION   = '2024-10-15';
  var ENDPOINT   = 'https://a.klaviyo.com/client/subscriptions/?company_id=' + COMPANY_ID;

  var form = document.getElementById('footer-newsletter');
  if (!form || typeof window.fetch !== 'function') return;

  var wrap   = form.closest('.signup');
  var input  = form.querySelector('input[type="email"]');
  var status = form.querySelector('.signup__status');
  if (!wrap || !input || !status) return;

  form.noValidate = true;

  function say(message, isError) {
    status.textContent = message;
    status.classList.toggle('signup__status--error', Boolean(isError));
  }

  function succeeded() {
    wrap.classList.remove('is-busy');
    wrap.classList.add('is-done');
    input.value = '';
    say('Thank you — you’re on the list.', false);
  }

  function failed(message) {
    wrap.classList.remove('is-busy');
    say(message || 'Sorry — that didn’t go through. Please try again.', true);
  }

  function payload(email) {
    return {
      data: {
        type: 'subscription',
        attributes: {
          profile: {
            data: {
              type: 'profile',
              attributes: {
                email: email,
                subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } }
              }
            }
          }
        },
        relationships: { list: { data: { type: 'list', id: LIST_ID } } }
      }
    };
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (wrap.classList.contains('is-done') || wrap.classList.contains('is-busy')) return;

    var email = input.value.trim();
    if (!email) {
      say('Please enter your email address.', true);
      input.focus();
      return;
    }
    if (!input.checkValidity()) {
      say('Please enter a valid email address.', true);
      input.focus();
      return;
    }

    wrap.classList.add('is-busy');
    say('Signing you up…', false);

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', revision: REVISION },
      body: JSON.stringify(payload(email))
    }).then(function (res) {
      // Klaviyo answers 202 Accepted; anything else is a real failure we can report.
      if (res.status === 202 || res.ok) { succeeded(); return; }
      if (res.status === 429) { failed('Too many attempts just now — please try again shortly.'); return; }
      if (res.status === 400) { failed('That email address was not accepted. Please check it and try again.'); return; }
      failed();
    }).catch(function () {
      failed();
    });
  });

  input.addEventListener('input', function () {
    if (status.classList.contains('signup__status--error')) say('', false);
  });
})();
