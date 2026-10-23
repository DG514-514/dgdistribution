'use strict';

// Contact details shown on the site and used by the inquiry form. Edit here.
const CONTACT = {
  email: 'sales@dgdistribution.ca',
  phone: '', // e.g. '+1 (514) 555-0123'
  whatsapp: '', // digits with country code, e.g. '15145550123' — adds a WhatsApp link
  location: '', // e.g. 'Montréal, Québec, Canada'
  linkedin: 'https://www.linkedin.com/company/dgdistribution/',
};

// Inquiries are delivered by FormSubmit (free, no account). The first submission sends a one-time
// activation email to CONTACT.email; after that every inquiry arrives as an email.
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT.email}`;

document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu
  const btn = document.querySelector('.menu-btn');
  const nav = document.getElementById('nav');
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
  });

  // Fade sections in as they scroll into view
  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { threshold: 0.12 });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add('in'));
  }

  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  // Contact details and footer links
  const el = (tag, props = {}) => Object.assign(document.createElement(tag), props);
  const list = document.getElementById('contact-list');
  const footer = document.getElementById('footer-links');
  const add = (label, node) => {
    const li = el('li');
    li.append(el('small', { textContent: label }), node);
    list.append(li);
  };
  const links = [];
  if (CONTACT.email) { add('Email', el('a', { href: `mailto:${CONTACT.email}`, textContent: CONTACT.email })); links.push(['Email', `mailto:${CONTACT.email}`]); }
  if (CONTACT.phone) add('Phone', el('a', { href: `tel:${CONTACT.phone.replace(/[^\d+]/g, '')}`, textContent: CONTACT.phone }));
  if (CONTACT.whatsapp) { add('WhatsApp', el('a', { href: `https://wa.me/${CONTACT.whatsapp}`, textContent: 'Message us on WhatsApp', target: '_blank', rel: 'noopener' })); links.push(['WhatsApp', `https://wa.me/${CONTACT.whatsapp}`]); }
  if (CONTACT.location) add('Location', el('span', { textContent: CONTACT.location }));
  if (CONTACT.linkedin) { add('LinkedIn', el('a', { href: CONTACT.linkedin, textContent: 'Follow DG Distribution', target: '_blank', rel: 'noopener' })); links.push(['LinkedIn', CONTACT.linkedin]); }
  links.forEach(([text, href]) => footer.append(el('a', { href, textContent: text, target: href.startsWith('http') ? '_blank' : '', rel: 'noopener' })));

  // Buyer / seller switch: changes a few labels and which fields show
  const form = document.getElementById('inquiry');
  const setRole = (role) => {
    form.querySelector(`input[name="role"][value="${role}"]`).checked = true;
    form.querySelectorAll('[data-for]').forEach((n) => { n.hidden = n.dataset.for !== role; });
  };
  form.querySelectorAll('input[name="role"]').forEach((r) => r.addEventListener('change', () => setRole(r.value)));
  document.querySelectorAll('a[data-role]').forEach((a) => a.addEventListener('click', () => setRole(a.dataset.role)));
  setRole('buyer');

  // Submit: send by email through FormSubmit; fall back to the visitor's email app if that fails
  const msg = form.querySelector('.form-msg');
  const submit = form.querySelector('button[type="submit"]');
  const show = (text, kind) => { msg.textContent = text; msg.className = `form-msg ${kind}`; msg.hidden = false; };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    if (d._honey) return; // bots fill the hidden field
    if (!d.name.trim()) { show('Please enter your name.', 'err'); form.name.focus(); return; }
    if (!d.company.trim()) { show('Please enter your company name.', 'err'); form.company.focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) { show('Please enter a valid email address.', 'err'); form.email.focus(); return; }

    const seller = d.role === 'seller';
    const fields = {
      'Inquiry type': seller ? 'SELLER — has stock to sell' : 'BUYER — wants to buy',
      Name: d.name, Company: d.company, Email: d.email, 'Phone / WhatsApp': d.phone, Country: d.country, Website: d.website,
      ...(seller ? {} : { 'Business type': d.business_type }),
      [seller ? 'Brands & categories available' : 'Brands & categories wanted']: d.brands,
      [seller ? 'Quantity & location' : 'Typical order size']: d.volume,
      Message: d.message,
    };
    const subject = `${seller ? 'Seller' : 'Buyer'} inquiry — ${d.company || d.name}`;
    submit.disabled = true;
    submit.textContent = 'Sending…';
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...fields, _subject: subject, _replyto: d.email, _template: 'table', _captcha: 'false' }),
      });
      const out = await res.json().catch(() => ({}));
      // First use only: FormSubmit asks the site owner to confirm the address before delivering.
      if (/activat/i.test(out.message || '')) {
        show(`Almost there — this form is being activated. Please check ${CONTACT.email} (and Junk/Spam) for the FormSubmit "Activate" email, then send again.`, 'err');
        return;
      }
      if (!res.ok || String(out.success) === 'false') throw new Error(out.message || 'Send failed');
      form.reset();
      setRole('buyer');
      show('Thank you — your inquiry has been sent. Our team will be in touch shortly.', 'ok');
    } catch {
      const body = Object.entries(fields).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
      show('We couldn’t send the form just now — opening your email app instead.', 'err');
      window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } finally {
      submit.disabled = false;
      submit.textContent = 'Send Inquiry';
    }
  });
});
