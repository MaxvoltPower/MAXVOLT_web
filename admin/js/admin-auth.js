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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', guard);
  } else {
    guard();
  }
})();