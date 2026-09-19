// ============================================
// Protects admin pages — include on every admin page
// after firebase-client.js + auth-client.js
//
// Behaviour:
//  - Not logged in          → redirect to /account/login.html
//  - Logged in, not admin   → sign out + redirect to /account/login.html
//  - Logged in, is admin    → expose window.currentAdmin + fire 'admin-ready'
// ============================================
(function () {
  function waitForAuth(cb) {
    if (window.maxvoltAuth) return cb();
    const t = setInterval(() => {
      if (window.maxvoltAuth) { clearInterval(t); cb(); }
    }, 50);
  }

  // Absolute paths so it works from /admin/dashboard.html and /admin/products.html alike.
  const LOGIN_URL = '/account/login.html';

  function guard() {
    waitForAuth(() => {
      let resolved = false;

      window.maxvoltAuth.onAuthChange(async (user) => {
        if (resolved) return;
        resolved = true;

        if (!user) {
          window.location.href = LOGIN_URL;
          return;
        }

        try {
          const profile = await window.maxvoltApi.verify();

          if (!profile || !profile.isAdmin) {
            // Not an admin — sign them out and send to the unified login.
            await window.maxvoltAuth.signOutUser();
            window.location.href = LOGIN_URL;
            return;
          }

          // Admin confirmed
          const el = document.getElementById('admin-email');
          if (el) el.textContent = profile.email || user.email;
          window.currentAdmin = profile;

          // Inject "View Site" link into the admin sidebar so admins
          // can always navigate back to the public website.
          injectViewSiteLink();

          document.dispatchEvent(new CustomEvent('admin-ready', { detail: profile }));
        } catch (e) {
          console.error('Admin guard failed:', e);
          window.location.href = LOGIN_URL;
        }
      });

      const logout = document.getElementById('admin-logout');
      if (logout) {
        logout.addEventListener('click', async (e) => {
          e.preventDefault();
          await window.maxvoltAuth.signOutUser();
          window.location.href = LOGIN_URL;
        });
      }
    });
  }

  // ----------------------------------------------------------------
  // Injects a "View Site" link and a "Signed in as…" header into every
  // admin sidebar so admins can navigate back to the public website.
  // ----------------------------------------------------------------
  function injectViewSiteLink() {
    const nav = document.querySelector('.admin-nav');
    if (!nav) return;
    if (nav.dataset.viewSiteInjected === '1') return;
    nav.dataset.viewSiteInjected = '1';

    // 1. "View Site" link (goes to homepage)
    const viewSite = document.createElement('a');
    viewSite.href = '/index.html';
    viewSite.target = '_blank';
    viewSite.rel = 'noopener';
    viewSite.className = 'admin-nav-view-site';
    viewSite.innerHTML = '🌐 View Site <span style="font-size:0.7rem;opacity:0.6;margin-left:auto;">↗</span>';

    // Insert just before the logout link so it stays near the bottom
    const logout = nav.querySelector('#admin-logout');
    if (logout) {
      nav.insertBefore(viewSite, logout);
    } else {
      nav.appendChild(viewSite);
    }

    // 2. Small inline style for the new link (mimics the existing nav links)
    const style = document.createElement('style');
    style.textContent = `
      .admin-nav-view-site {
        margin-top: 12px;
        padding: 12px 16px;
        border-radius: 10px;
        color: var(--accent, #38bdf8);
        font-weight: 600;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 10px;
        border-top: 1px solid var(--border, #1f2b45);
        transition: background 200ms, color 200ms;
      }
      .admin-nav-view-site:hover {
        background: rgba(56, 189, 248, 0.1);
        color: #7dd3fc;
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', guard);
  } else {
    guard();
  }
})();