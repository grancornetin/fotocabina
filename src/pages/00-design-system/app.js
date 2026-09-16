// Selector de tema: oscuro / claro / sistema, persistido en localStorage
(function initThemeSwitch() {
  const STORAGE_KEY = 'fotocabina-theme';
  const root = document.documentElement;
  const buttons = document.querySelectorAll('[data-theme-choice]');

  function applyChoice(choice) {
    if (choice === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', choice);
    }
    buttons.forEach((btn) => {
      btn.setAttribute('aria-checked', String(btn.dataset.themeChoice === choice));
    });
  }

  let saved = 'dark';
  try {
    saved = localStorage.getItem(STORAGE_KEY) || 'dark';
  } catch (e) {
    // localStorage puede no estar disponible; seguimos con 'dark' por defecto
  }
  applyChoice(saved);

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const choice = btn.dataset.themeChoice;
      applyChoice(choice);
      try {
        localStorage.setItem(STORAGE_KEY, choice);
      } catch (e) {
        // sin persistencia disponible, el tema igual se aplica en esta sesión
      }
    });
  });
})();

// Tabs: click cambia aria-selected
document.querySelectorAll('[role="tablist"]').forEach((tablist) => {
  const tabs = tablist.querySelectorAll('[role="tab"]');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.setAttribute('aria-selected', 'false'));
      tab.setAttribute('aria-selected', 'true');
    });
  });
});

// Toggle: click invierte aria-checked
document.querySelectorAll('.ds-toggle').forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const isOn = toggle.getAttribute('aria-checked') === 'true';
    toggle.setAttribute('aria-checked', String(!isOn));
  });
});

// Countdown demo: cuenta 3-2-1 y muestra el ícono de cámara (monocromático, sin emojis) al disparar
const countdownNumber = document.getElementById('countdownNumber');
const shutterBtn = document.getElementById('shutterBtn');

const CAMERA_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:0.62em;height:0.62em;display:inline-block;vertical-align:middle"><rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="3.5"/><path d="M9 6l1.5-2h3L15 6"/></svg>';

function runCountdownDemo() {
  const sequence = [3, 2, 1];
  let i = 0;
  countdownNumber.textContent = sequence[0];
  countdownNumber.classList.remove('ds-countdown-number--shot');

  const tick = () => {
    i += 1;
    if (i < sequence.length) {
      countdownNumber.textContent = sequence[i];
      setTimeout(tick, 700);
    } else {
      countdownNumber.innerHTML = CAMERA_ICON;
      countdownNumber.classList.add('ds-countdown-number--shot');
      setTimeout(() => {
        countdownNumber.textContent = sequence[0];
        countdownNumber.classList.remove('ds-countdown-number--shot');
      }, 900);
    }
  };

  setTimeout(tick, 700);
}

if (shutterBtn) {
  shutterBtn.addEventListener('click', runCountdownDemo);
}
