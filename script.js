/* ===========================
   MVSR Food Hub - script.js
   Includes: showMenu & Token queue system
   =========================== */

/* ------------- showMenu (keeps previous functionality) ------------- */
function showMenu(place) {
  // hide all menu cards
  const allMenus = document.querySelectorAll(".menu-card");
  allMenus.forEach(menu => menu.classList.add("hidden"));

  // show the main menu section
  const menuSection = document.getElementById("menu-section");
  if (menuSection) menuSection.classList.remove("hidden");

  // show only selected menu
  const selected = document.getElementById(`${place}-menu`);
  if (selected) {
    selected.classList.remove("hidden");
    selected.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/* ------------- Token System ------------- */
/* Place codes used for tokens (3-letter codes) */
const PLACE_CODES = {
  chaiverse: "CHA",
  juicejunction: "JUI",
  maggimitra: "MAG",
  southstation: "SOU",
  spicehub: "SPI",
  sweetspot: "SWT"
};

const STORAGE_KEY = "mvsr_token_state";

/* Initial structure example:
{
  chaiverse: { next: 1, queue: [], current: null },
  juicejunction: { next: 1, queue: [], current: null },
  ...
}
*/
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    // create initial
    const init = {};
    Object.keys(PLACE_CODES).forEach(k => init[k] = { next: 1, queue: [], current: null });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
    return init;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    // corrupted — reset
    const init = {};
    Object.keys(PLACE_CODES).forEach(k => init[k] = { next: 1, queue: [], current: null });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
    return init;
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* generate token id like 'CHA-001' */
function formatToken(code, number) {
  return `${code}-${String(number).padStart(3, "0")}`;
}

/* render the queues into the staff area */
function renderQueues() {
  const state = loadState();
  const container = document.getElementById("queues-container");
  if (!container) return;

  container.innerHTML = ""; // clear

  Object.keys(PLACE_CODES).forEach(place => {
    const code = PLACE_CODES[place];
    const data = state[place];
    const box = document.createElement("div");
    box.className = "queue-box";
    box.innerHTML = `
      <h4>${place.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/(^\w)/, s => s.toUpperCase())}</h4>
      <div class="small">Now serving: ${data.current ? data.current : "—"}</div>
      <div class="queue-list" id="${place}-list"></div>
      <button class="serve-btn" data-place="${place}">Serve next</button>
      <button class="serve-btn" data-place="${place}-clear" style="background:#ff6b35;margin-left:8px;">Clear</button>
    `;
    container.appendChild(box);

    // fill queue-list
    const list = box.querySelector(`#${place}-list`);
    if (data.queue.length === 0) {
      list.innerHTML = `<div class="small">No waiting tokens</div>`;
    } else {
      list.innerHTML = "";
      data.queue.forEach(tok => {
        const span = document.createElement("span");
        span.textContent = tok;
        list.appendChild(span);
      });
    }
  });

  // attach events to serve buttons
  container.querySelectorAll(".serve-btn").forEach(btn => {
    btn.onclick = () => {
      const key = btn.dataset.place;
      if (key && key.endsWith("-clear")) {
        // clear queue for place
        const place = key.split("-clear")[0];
        clearQueue(place);
      } else {
        serveNext(btn.dataset.place);
      }
    };
  });
}

/* generate token and push to queue */
function generateToken(place) {
  const state = loadState();
  if (!state[place]) return null;
  const code = PLACE_CODES[place];
  const num = state[place].next;
  const token = formatToken(code, num);
  state[place].queue.push(token);
  state[place].next = num + 1;
  saveState(state);
  renderQueues();
  return token;
}

/* user-facing function when clicking Get Token */
function onGetTokenClicked(place) {
  const token = generateToken(place);
  if (!token) return;
  // show confirmation area
  const confirm = document.getElementById("token-confirm");
  confirm.classList.remove("hidden");
  confirm.innerHTML = `
    <p>Your token for <strong>${place}</strong> is</p>
    <p style="font-size:20px;color:#ff6b35">${token}</p>
    <p class="small">Check 'Current Queues' to see when it's served.</p>
  `;
  // auto-hide after 10s
  setTimeout(() => { confirm.classList.add("hidden"); }, 10000);
}

/* serve next in line for a place (staff) */
function serveNext(place) {
  const state = loadState();
  if (!state[place]) return;
  if (state[place].queue.length === 0) {
    // nothing to serve
    state[place].current = null;
  } else {
    const nextTok = state[place].queue.shift();
    state[place].current = nextTok;
  }
  saveState(state);
  renderQueues();
}

/* clear queue for a place (useful during demo) */
function clearQueue(place) {
  const state = loadState();
  if (!state[place]) return;
  state[place].queue = [];
  state[place].current = null;
  saveState(state);
  renderQueues();
}

/* Attach handlers to all Get Token buttons and initialize */
function initTokenSystem() {
  // Get token buttons
  document.querySelectorAll(".get-token").forEach(btn => {
    btn.onclick = () => {
      const place = btn.dataset.place;
      onGetTokenClicked(place);
    };
  });

  // Render existing queues (from localStorage)
  renderQueues();
}

/* Initialize on DOM ready */
document.addEventListener("DOMContentLoaded", () => {
  // initialize token system
  initTokenSystem();

  // existing code: if any menu visibility should be hidden initially, keep hidden
  // (no changes here)
});
