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

// Shop direct: the brands, product types and sizes shoppers can pick from. Edit here.
const range = (from, to, step, fmt = String) => Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => fmt(from + i * step));
const ADULT = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const SHOP = {
  brands: ['Adidas', 'Agua Bendita', 'Asics', 'Burberry', 'Calvin Klein', 'Canada Goose', 'Carhartt', 'Champion', 'Cole Haan', 'Converse', 'Diesel', 'Dior',
    'Fendi', 'Golden Goose', 'Gucci', 'Hanes', 'Havaianas', 'Hoka', 'Lacoste', "Levi's", 'Moncler', 'Moschino', 'New Balance', 'Nike', 'Off-White', 'On', 'Puma', 'Reebok', 'True Religion', 'UGG'],
  categories: {
    Footwear: ['Sneakers', 'Running shoes', 'Boots', 'Sandals & slides', 'Dress & casual shoes'],
    Apparel: ['T-shirts & tops', 'Hoodies & sweatshirts', 'Pants & jeans', 'Shorts', 'Jackets & outerwear', 'Swimwear'],
  },
  sizes: {
    Footwear: {
      "Men's": [...range(6, 13, 0.5, (n) => `US ${n}`), 'US 14', 'US 15'],
      "Women's": range(5, 12, 0.5, (n) => `US ${n}`),
      Kids: [...range(10, 13.5, 0.5, (n) => `US ${n}C`), ...range(1, 7, 0.5, (n) => `US ${n}Y`)],
    },
    Apparel: {
      "Men's": ADULT,
      "Women's": ADULT,
      Kids: ['XS (4–5)', 'S (6–7)', 'M (8–10)', 'L (12–14)', 'XL (16)'],
    },
  },
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

  // Send a form by email through FormSubmit; fall back to the visitor's email app if that fails.
  // build(d, show) validates the form data and returns { fields, subject, thanks }, or nothing to stop.
  const wireForm = (f, build, afterReset) => {
    const msg = f.querySelector('.form-msg');
    const submit = f.querySelector('button[type="submit"]');
    const label = submit.textContent;
    const show = (text, kind) => { msg.textContent = text; msg.className = `form-msg ${kind}`; msg.hidden = false; };
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f));
      if (d._honey) return; // bots fill the hidden field
      const req = build(d, show);
      if (!req) return;
      const { fields, subject, thanks } = req;
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
        f.reset();
        afterReset();
        show(thanks, 'ok');
      } catch {
        const body = Object.entries(fields).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
        show('We couldn’t send the form just now — opening your email app instead.', 'err');
        window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      } finally {
        submit.disabled = false;
        submit.textContent = label;
      }
    });
  };
  const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  // Wholesale inquiry
  wireForm(form, (d, show) => {
    if (!d.name.trim()) { show('Please enter your name.', 'err'); form.name.focus(); return; }
    if (!d.company.trim()) { show('Please enter your company name.', 'err'); form.company.focus(); return; }
    if (!validEmail(d.email)) { show('Please enter a valid email address.', 'err'); form.email.focus(); return; }
    const seller = d.role === 'seller';
    return {
      fields: {
        'Inquiry type': seller ? 'SELLER — has stock to sell' : 'BUYER — wants to buy',
        Name: d.name, Company: d.company, Email: d.email, 'Phone / WhatsApp': d.phone, Country: d.country, Website: d.website,
        ...(seller ? {} : { 'Business type': d.business_type }),
        [seller ? 'Brands & categories available' : 'Brands & categories wanted']: d.brands,
        [seller ? 'Quantity & location' : 'Typical order size']: d.volume,
        Message: d.message,
      },
      subject: `${seller ? 'Seller' : 'Buyer'} inquiry — ${d.company || d.name}`,
      thanks: 'Thank you — your inquiry has been sent. Our team will be in touch shortly.',
    };
  }, () => setRole('buyer'));

  // Shop direct: brand → product → size, then we email price & availability
  const shop = document.getElementById('shop-form');
  const chip = (name, value) => {
    const l = el('label', { className: 'chip' });
    l.append(el('input', { type: 'radio', name, value }), el('span', { textContent: value }));
    return l;
  };
  const brandBox = document.getElementById('shop-brands');
  [...SHOP.brands, 'Other'].forEach((b) => brandBox.append(chip('brand', b)));
  const other = shop.querySelector('[data-other]');
  const fill = (select, options, empty) => {
    select.replaceChildren(el('option', { value: '', textContent: options ? 'Choose…' : empty }));
    (options || []).forEach((o) => select.append(el('option', { value: o, textContent: o })));
    select.disabled = !options;
  };
  const refresh = () => {
    const type = shop.querySelector('input[name="type"]:checked')?.value;
    const fit = shop.querySelector('input[name="fit"]:checked')?.value;
    other.hidden = shop.querySelector('input[name="brand"]:checked')?.value !== 'Other';
    if (shop.category.dataset.type !== (type || '')) {
      fill(shop.category, type && SHOP.categories[type], 'Choose footwear or apparel first');
      shop.category.dataset.type = type || '';
    }
    const key = `${type}|${fit}`;
    if (shop.size.dataset.key !== key) {
      const sizes = type && fit && SHOP.sizes[type][fit];
      fill(shop.size, sizes && [...sizes, 'Not sure — I’ll add it in the notes'], 'Choose a product and fit first');
      shop.size.dataset.key = key;
    }
  };
  shop.addEventListener('change', (e) => { if (e.target.type === 'radio') refresh(); });
  refresh();

  wireForm(shop, (d, show) => {
    const need = (ok, text, field) => { if (!ok) { show(text, 'err'); field.focus(); } return ok; };
    const brand = d.brand === 'Other' ? (d.brand_other || '').trim() : d.brand;
    if (!need(d.brand, 'Please choose a brand.', brandBox.querySelector('input'))) return;
    if (!need(brand, 'Please tell us which brand.', shop.brand_other)) return;
    if (!need(d.type, 'Please choose footwear or apparel.', shop.querySelector('input[name="type"]'))) return;
    if (!need(d.category, 'Please choose the type of product.', shop.category)) return;
    if (!need(d.fit, 'Please choose men’s, women’s or kids.', shop.querySelector('input[name="fit"]'))) return;
    if (!need(d.size, 'Please choose your size.', shop.size)) return;
    if (!need(d.name.trim(), 'Please enter your name.', shop.elements.name)) return;
    if (!need(validEmail(d.email), 'Please enter a valid email address.', shop.email)) return;
    return {
      fields: {
        'Inquiry type': 'SHOP DIRECT — consumer wants price & availability',
        Brand: brand, Product: `${d.type} — ${d.category}`, Fit: d.fit, Size: d.size, 'Model / colour / style': d.details,
        Name: d.name, Email: d.email, Phone: d.phone, 'City & country': d.location,
      },
      subject: `Shop request — ${brand} ${d.category}, ${d.fit} ${d.size} — ${d.name}`,
      thanks: 'Thank you — your request has been sent. We’ll email you the price and availability shortly.',
    };
  }, refresh);
});
