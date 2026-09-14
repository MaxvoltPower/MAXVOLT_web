// Protects admin pages — include on every admin page after firebase-client.js + auth-client.js
(function () {
  function waitForAuth(cb) {
    if (window.maxvoltAuth) return cb();
    const t = setInterval(() => {
      if (window.maxvoltAuth) { clearInterval(t); cb(); }
    }, 50);
  }

  function guard() {
    waitForAuth(() => {
      window.maxvoltAuth.onAuthChange(async (user) => {
        if (!user) {
          window.location.href = 'index.html';
          return;
        }
        try {
          const profile = await window.maxvoltApi.verify();
          if (!profile.isAdmin) {
            await window.maxvoltAuth.signOutUser();
            window.location.href = 'index.html';
            return;
          }
          const el = document.getElementById('admin-email');
          if (el) el.textContent = profile.email || user.email;
          window.currentAdmin = profile;
          document.dispatchEvent(new CustomEvent('admin-ready', { detail: profile }));
        } catch (e) {
          console.error(e);
          window.location.href = 'index.html';
        }
      });

      const logout = document.getElementById('admin-logout');
      if (logout) {
        logout.addEventListener('click', async (e) => {
          e.preventDefault();
          await window.maxvoltAuth.signOutUser();
          window.location.href = 'index.html';
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