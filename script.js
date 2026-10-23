'use strict';

// Contact details shown on the site and used by the inquiry form. Edit here.
const CONTACT = {
  email: '', // e.g. 'sales@dgdistribution.ca' — to be confirmed
  phone: '', // e.g. '+1 (514) 555-0123'
  location: '', // e.g. 'Montréal, Québec, Canada'
};

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
    }), { threshold: 0.15 });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add('in'));
  }

  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  // Contact details
  const list = document.getElementById('contact-list');
  const add = (label, node) => {
    const li = document.createElement('li');
    const small = document.createElement('small');
    small.textContent = label;
    li.append(small, node);
    list.append(li);
  };
  const link = (href, text) => Object.assign(document.createElement('a'), { href, textContent: text });
  if (CONTACT.email) add('Email', link(`mailto:${CONTACT.email}`, CONTACT.email));
  if (CONTACT.phone) add('Phone', link(`tel:${CONTACT.phone.replace(/[^\d+]/g, '')}`, CONTACT.phone));
  if (CONTACT.location) add('Location', Object.assign(document.createElement('span'), { textContent: CONTACT.location }));

  // Buttons like "Get Current Offers" pre-select the subject
  const form = document.getElementById('inquiry');
  document.querySelectorAll('[data-subject]').forEach((a) => a.addEventListener('click', () => {
    if (a.dataset.subject === 'Current offers') form.interest.selectedIndex = 0;
  }));

  // Inquiry form: opens the visitor's email app with the inquiry ready to send
  const error = form.querySelector('.form-error');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const fail = (msg, field) => { error.textContent = msg; error.hidden = false; if (field) form[field].focus(); };
    error.hidden = true;
    if (!d.name.trim()) return fail('Please enter your name.', 'name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) return fail('Please enter a valid email address.', 'email');
    if (!CONTACT.email) return fail('Our contact email is being updated — please try again shortly.');
    const body = [
      `Name: ${d.name}`, d.company && `Company: ${d.company}`, `Email: ${d.email}`, d.phone && `Phone: ${d.phone}`,
      `Interested in: ${d.interest}`, '', d.message,
    ].filter((l) => l !== '' && l != null && l !== false).join('\n');
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(`Inquiry: ${d.interest} — ${d.name}`)}&body=${encodeURIComponent(body)}`;
  });
});
