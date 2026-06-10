const state = {
  password: localStorage.getItem("ranking_common_password") || "",
  adminPassword: sessionStorage.getItem("ranking_admin_password") || "",
  programmers: [],
  votes: [],
  ranking: []
};

const els = {
  loginScreen: document.getElementById("login-screen"),
  appScreen: document.getElementById("app-screen"),

  loginForm: document.getElementById("login-form"),
  commonPassword: document.getElementById("common-password"),
  loginError: document.getElementById("login-error"),

  logoutButton: document.getElementById("logout-button"),
  refreshButton: document.getElementById("refresh-button"),

  voteForm: document.getElementById("vote-form"),
  voterName: document.getElementById("voter-name"),
  programmerSelect: document.getElementById("programmer-select"),
  pointsOptions: document.getElementById("points-options"),
  justification: document.getElementById("justification"),
  voteMessage: document.getElementById("vote-message"),

  rankingBody: document.getElementById("ranking-body"),
  podium: document.getElementById("podium"),
  historyList: document.getElementById("history-list"),

  adminOpenButton: document.getElementById("admin-open-button"),
  adminPanel: document.getElementById("admin-panel"),
  adminCloseButton: document.getElementById("admin-close-button"),
  adminList: document.getElementById("admin-list"),

  adminDialog: document.getElementById("admin-dialog"),
  adminLoginForm: document.getElementById("admin-login-form"),
  adminPasswordInput: document.getElementById("admin-password"),
  adminCancelButton: document.getElementById("admin-cancel-button"),
  adminError: document.getElementById("admin-error")
};

boot();

function boot() {
  renderPointsOptions();
  bindEvents();

  if (state.password) {
    showApp();
    loadState();
  } else {
    showLogin();
  }
}

function bindEvents() {
  els.loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const password = els.commonPassword.value.trim();

    hideError(els.loginError);

    try {
      state.password = password;
      await loadState();

      localStorage.setItem("ranking_common_password", password);
      showApp();
    } catch (error) {
      state.password = "";
      localStorage.removeItem("ranking_common_password");
      showError(els.loginError, error.message);
    }
  });

  els.logoutButton.addEventListener("click", function () {
    localStorage.removeItem("ranking_common_password");
    sessionStorage.removeItem("ranking_admin_password");

    state.password = "";
    state.adminPassword = "";

    showLogin();
  });

  els.refreshButton.addEventListener("click", async function () {
    await loadState();
  });

  els.voteForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    await submitVote();
  });

  els.adminOpenButton.addEventListener("click", function () {
    hideError(els.adminError);

    if (state.adminPassword) {
      loadAdminState();
      return;
    }

    els.adminDialog.showModal();
  });

  els.adminCancelButton.addEventListener("click", function () {
    els.adminDialog.close();
  });

  els.adminLoginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    hideError(els.adminError);

    state.adminPassword = els.adminPasswordInput.value.trim();

    try {
      await loadAdminState();

      sessionStorage.setItem("ranking_admin_password", state.adminPassword);
      els.adminDialog.close();
      els.adminPasswordInput.value = "";
    } catch (error) {
      state.adminPassword = "";
      sessionStorage.removeItem("ranking_admin_password");
      showError(els.adminError, error.message);
    }
  });

  els.adminCloseButton.addEventListener("click", function () {
    els.adminPanel.hidden = true;
  });
}

function showLogin() {
  els.loginScreen.hidden = false;
  els.appScreen.hidden = true;
}

function showApp() {
  els.loginScreen.hidden = true;
  els.appScreen.hidden = false;
}

async function loadState() {
  const response = await api("getState", {
    password: state.password
  });

  state.programmers = response.programmers || [];
  state.votes = response.votes || [];
  state.ranking = response.ranking || [];

  renderAll();
}

async function loadAdminState() {
  const response = await api("getAdminState", {
    adminPassword: state.adminPassword
  });

  state.programmers = response.programmers || [];
  state.votes = response.votes || [];
  state.ranking = response.ranking || [];

  renderAll();
  renderAdmin();
  els.adminPanel.hidden = false;
}

async function submitVote() {
  hideMessage(els.voteMessage);

  const pointsInput = document.querySelector("input[name='points']:checked");

  if (!pointsInput) {
    showMessage(els.voteMessage, "Debes elegir una puntuación.", "error");
    return;
  }

  try {
    await api("addVote", {
      password: state.password,
      voterName: els.voterName.value.trim(),
      programmerId: els.programmerSelect.value,
      points: pointsInput.value,
      justification: els.justification.value.trim()
    });

    els.justification.value = "";
    showMessage(els.voteMessage, "Voto guardado correctamente.", "success");

    await loadState();
  } catch (error) {
    showMessage(els.voteMessage, error.message, "error");
  }
}

function renderAll() {
  renderProgrammers();
  renderRanking();
  renderHistory();
}

function renderPointsOptions() {
  els.pointsOptions.innerHTML = "";

  [-3, -2, -1, 0, 1, 2, 3].forEach(function (points) {
    const id = "points-" + points;

    const label = document.createElement("label");
    label.className = "point-option";
    label.htmlFor = id;

    label.innerHTML = `
      <input id="${id}" name="points" type="radio" value="${points}" ${points === 3 ? "checked" : ""}>
      <span>${points > 0 ? "+" + points : points}</span>
    `;

    els.pointsOptions.appendChild(label);
  });
}

function renderProgrammers() {
  els.programmerSelect.innerHTML = "";

  state.programmers
    .filter(function (programmer) {
      return programmer.active;
    })
    .forEach(function (programmer) {
      const option = document.createElement("option");
      option.value = programmer.id;
      option.textContent = programmer.name;
      els.programmerSelect.appendChild(option);
    });
}

function renderRanking() {
  els.rankingBody.innerHTML = "";

  if (!state.ranking.length) {
    els.rankingBody.innerHTML = `
      <tr>
        <td colspan="4">No hay programadores todavía.</td>
      </tr>
    `;
    els.podium.innerHTML = "";
    return;
  }

  const first = state.ranking[0];
  const last = state.ranking[state.ranking.length - 1];

  els.podium.innerHTML = `
    <div class="podium-card">
      <strong>Mas julapa:</strong> ${escapeHtml(first.name)} (${formatSignedNumber(first.total)})
    </div>
    <div class="podium-card">
      <strong>Mas macho:</strong> ${escapeHtml(last.name)} (${formatSignedNumber(last.total)})
    </div>
  `;

  state.ranking.forEach(function (item) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.position}</td>
      <td>${escapeHtml(item.name)}</td>
      <td>${formatPoints(item.total)}</td>
      <td>${item.votesCount}</td>
    `;

    els.rankingBody.appendChild(tr);
  });
}

function renderHistory() {
  const votes = [...state.votes]
    .filter(function (vote) {
      return !vote.deleted;
    })
    .sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  if (!votes.length) {
    els.historyList.innerHTML = `<p class="muted">Todavía no hay votos.</p>`;
    return;
  }

  els.historyList.innerHTML = votes.map(function (vote) {
    const programmer = findProgrammer(vote.programmerId);

    return `
      <article class="history-item">
        <div>
          <strong>${escapeHtml(vote.voterName)}</strong>
          ha dado
          <strong>${formatPoints(vote.points)}</strong>
          a
          <strong>${escapeHtml(programmer ? programmer.name : vote.programmerId)}</strong>
        </div>
        <p>${escapeHtml(vote.justification)}</p>
        <small>${formatDate(vote.createdAt)}</small>
      </article>
    `;
  }).join("");
}

function renderAdmin() {
  const votes = [...state.votes].sort(function (a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  if (!votes.length) {
    els.adminList.innerHTML = `<p class="muted">No hay votos.</p>`;
    return;
  }

  els.adminList.innerHTML = votes.map(function (vote) {
    const programmer = findProgrammer(vote.programmerId);

    return `
      <article class="admin-item ${vote.deleted ? "deleted" : ""}">
        <div>
          <strong>${escapeHtml(vote.voterName)}</strong>
          → 
          <strong>${escapeHtml(programmer ? programmer.name : vote.programmerId)}</strong>
          <small>${formatDate(vote.createdAt)}</small>
        </div>

        <label>
          Puntos
          <select data-admin-points="${vote.id}">
            ${[-3, -2, -1, 0, 1, 2, 3].map(function (points) {
              return `
                <option value="${points}" ${Number(vote.points) === points ? "selected" : ""}>
                  ${points > 0 ? "+" + points : points}
                </option>
              `;
            }).join("")}
          </select>
        </label>

        <label>
          Justificación
          <textarea data-admin-justification="${vote.id}" rows="3">${escapeHtml(vote.justification)}</textarea>
        </label>

        <div class="admin-actions">
          <button type="button" onclick="saveVoteEdit('${vote.id}')">Guardar cambios</button>
          ${
            vote.deleted
              ? `<button type="button" class="secondary" onclick="restoreVote('${vote.id}')">Restaurar</button>`
              : `<button type="button" class="danger" onclick="deleteVote('${vote.id}')">Eliminar</button>`
          }
        </div>
      </article>
    `;
  }).join("");
}

async function saveVoteEdit(voteId) {
  const pointsInput = document.querySelector(`[data-admin-points="${voteId}"]`);
  const justificationInput = document.querySelector(`[data-admin-justification="${voteId}"]`);

  await api("updateVote", {
    adminPassword: state.adminPassword,
    voteId: voteId,
    points: pointsInput.value,
    justification: justificationInput.value.trim()
  });

  await loadAdminState();
}

async function deleteVote(voteId) {
  await api("deleteVote", {
    adminPassword: state.adminPassword,
    voteId: voteId
  });

  await loadAdminState();
}

async function restoreVote(voteId) {
  await api("restoreVote", {
    adminPassword: state.adminPassword,
    voteId: voteId
  });

  await loadAdminState();
}

function api(action, params) {
  return new Promise(function (resolve, reject) {
    const callbackName = "jsonp_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    const url = new URL(CONFIG.API_URL);

    url.searchParams.set("callback", callbackName);
    url.searchParams.set("action", action);

    Object.entries(params || {}).forEach(function ([key, value]) {
      url.searchParams.set(key, value);
    });

    const script = document.createElement("script");

    const timeout = setTimeout(function () {
      cleanup();
      reject(new Error("La petición ha tardado demasiado."));
    }, 15000);

    window[callbackName] = function (response) {
      cleanup();

      if (!response || !response.ok) {
        reject(new Error(response && response.error ? response.error : "Error desconocido."));
        return;
      }

      resolve(response);
    };

    script.onerror = function () {
      cleanup();
      reject(new Error("No se ha podido conectar con Google Apps Script."));
    };

    script.src = url.toString();
    document.body.appendChild(script);

    function cleanup() {
      clearTimeout(timeout);
      delete window[callbackName];

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    }
  });
}

function findProgrammer(programmerId) {
  return state.programmers.find(function (programmer) {
    return programmer.id === programmerId;
  });
}

function formatPoints(points) {
  const value = Number(points);
  const className =
    value > 0
      ? "points-positive"
      : value < 0
        ? "points-negative"
        : "points-zero";

  return `<span class="${className}">${formatSignedNumber(value)}</span>`;
}

function formatSignedNumber(value) {
  const number = Number(value);
  return number > 0 ? "+" + number : String(number);
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "";
  }

  return date.toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function showError(element, message) {
  element.textContent = message;
  element.hidden = false;
}

function hideError(element) {
  element.textContent = "";
  element.hidden = true;
}

function showMessage(element, message, type) {
  element.textContent = message;
  element.hidden = false;
  element.className = type || "";
}

function hideMessage(element) {
  element.textContent = "";
  element.hidden = true;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}