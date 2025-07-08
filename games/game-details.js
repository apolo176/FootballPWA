// Inicializar Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDe5kV8p9GnYb1MKSlMZnajeyARDzCe2DU",
  authDomain: "firestore1-4590c.firebaseapp.com",
  projectId: "firestore1-4590c",
  storageBucket: "firestore1-4590c.appspot.com",
  messagingSenderId: "108637054681",
  appId: "1:108637054681:web:9f07fc8bb2201c309640c8",
  measurementId: "G-V3EVS5XF2Z"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ✅ Obtener el gameId desde la URL
const params = new URLSearchParams(window.location.search);
const gameId = params.get('id');

if (!gameId) {
  document.getElementById('gameDetails').textContent = 'ID del partido no proporcionado.';
  throw new Error("No se encontró 'id' en la URL");
}

// ✅ Cargar los datos del partido
async function cargarDatosDelPartido(gameId) {
  const container = document.getElementById('gameDetails');

  try {
    const doc = await db.collection('games').doc(gameId).get();

    if (!doc.exists) {
      container.textContent = 'Partido no encontrado.';
      return;
    }

    const g = doc.data();

    // Mostrar información básica del partido
    container.innerHTML = `
      <h2>${g.local ? 'C.D Peña vs ' + g.rivalName : g.rivalName + ' vs Nuestro Equipo'}</h2>
      <p><strong>Fecha:</strong> ${new Date(g.dateTime.toDate()).toLocaleString()}</p>
      <p><strong>Estadio:</strong> ${g.stadium}</p>
      <p><strong>Ciudad:</strong> ${g.city}</p>
      <p><strong>Árbitro:</strong> ${g.referee || 'No especificado'}</p>
    `;

    const phase = g.phase || 'pre';
    const lineup = g.lineup || [];
    const bench = g.bench || [];
    const events = g.events || [];

    // Mostrar solo la fase correspondiente y bloquear las demás
    activarFase(phase);

    // Llamar a funciones específicas de cada fase (puedes implementarlas aparte)
    if (phase === 'pre') {
      renderFasePre(lineup, bench);
    } else if (phase === 'live') {
      renderFaseLive(lineup, bench, events);
    } else if (phase === 'post') {
      renderFasePost(events);
    }

  } catch (error) {
    console.error("Error al obtener detalles del partido:", error);
    container.textContent = 'Error cargando datos.';
  }
}

// ✅ Lógica para cambiar entre pestañas
document.querySelectorAll('.tab').forEach(button => {
  button.addEventListener('click', () => {
    const selectedPhase = button.dataset.phase;

    // Si no es la fase actual, avisar
    if (!document.getElementById(`${selectedPhase}-phase`).classList.contains('active')) {
      alert('Esta fase no está disponible actualmente.');
      return;
    }

    // Activar pestaña visual
    document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    // Mostrar sección activa
    document.querySelectorAll('.phase').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(`${selectedPhase}-phase`).classList.add('active');
  });
});

// ✅ Mostrar solo la fase activa y bloquear el resto
function activarFase(faseActual) {
  const fases = ['pre', 'live', 'post'];

  fases.forEach(f => {
    const section = document.getElementById(`${f}-phase`);
    const tab = document.querySelector(`.tab[data-phase="${f}"]`);
    if (f === faseActual) {
      section.classList.add('active');
      tab.classList.add('active');
    } else {
      section.classList.remove('active');
      tab.classList.remove('active');
    }
  });
}

async function renderFasePre(lineup, bench) {
  console.log('Renderizando FASE PRE');

  try {
    // ✅ Obtener todos los jugadores
    const snapshot = await db.collection("players").get();
    const allPlayers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // ✅ Mostrar jugadores en sus respectivas listas
    renderPlayerList("titulares-list", lineup || [], allPlayers);
    renderPlayerList("suplentes-list", bench || [], allPlayers);

    const descartados = allPlayers.filter(p =>
      !(lineup || []).includes(p.id) && !(bench || []).includes(p.id)
    );
    renderPlayerList("descartados-list", descartados.map(p => p.id), allPlayers);
    enableDragAndDrop();

    // ✅ Botón para comenzar el partido
    document.getElementById("start-match").addEventListener("click", async () => {
      const nuevosTitulares = getPlayerIdsFrom("titulares-list");
      const nuevosSuplentes = getPlayerIdsFrom("suplentes-list");

      await db.collection('games').doc(gameId).update({
        phase: "live",
        lineup: nuevosTitulares,
        bench: nuevosSuplentes,
        events: [] // iniciar sin eventos
      });

      location.reload(); // Recargar página para pasar a fase en vivo
    });

  } catch (error) {
    console.error("Error al cargar jugadores para fase PRE:", error);
  }
}

function renderPlayerList(containerId, playerIds, allPlayers) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  playerIds.forEach(id => {
    const player = allPlayers.find(p => p.id === id);
    if (player) {
      const div = document.createElement("div");
      div.textContent = player.name;
      div.className = "player-card";
      div.dataset.id = player.id;
      container.appendChild(div);
    }
  });
}

function getPlayerIdsFrom(containerId) {
  return [...document.getElementById(containerId).children].map(div => div.dataset.id);
}



async function renderFaseLive(lineup, bench, events) {
  const container = document.getElementById("players-events");
  container.innerHTML = "<h3>Acciones por Jugador</h3>";

  try {
    const snap = await db.collection("players").get();
    const allPlayers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const jugadores = [...(lineup || []), ...(bench || [])]
      .map(id => allPlayers.find(p => p.id === id))
      .filter(Boolean);

    jugadores.forEach(player => {
      const card = document.createElement("div");
      card.className = "player-card";
      card.innerHTML = `
        <strong>${player.name}</strong>
        <button data-type="goal" data-id="${player.id}">⚽ Gol</button>
        <button data-type="yellow" data-id="${player.id}">🟨 Amarilla</button>
        <button data-type="red" data-id="${player.id}">🟥 Roja</button>
      `;
      container.appendChild(card);
    });

    // Escuchar clicks en botones
    container.addEventListener("click", async (e) => {
      if (e.target.tagName !== "BUTTON") return;
      const type = e.target.dataset.type;
      const playerId = e.target.dataset.id;

      const minute = prompt("¿Minuto del evento?", "0");
      if (minute === null || isNaN(parseInt(minute))) return;

      const newEvent = {
        type,
        playerId,
        time: parseInt(minute)
      };

      await db.collection("games").doc(gameId).update({
        events: firebase.firestore.FieldValue.arrayUnion(newEvent)
      });

      alert("Evento registrado ✅");
    });

  } catch (error) {
    console.error("Error en fase live:", error);
  }

  // Botón para finalizar partido
  document.getElementById("end-match").addEventListener("click", async () => {
    await db.collection("games").doc(gameId).update({ phase: "post" });
    location.reload();
  });
}

function setupCambio(jugadores) {
  const selectIn = document.getElementById("player-in");
  const selectOut = document.getElementById("player-out");
  const btn = document.getElementById("confirm-sub");

  jugadores.forEach(p => {
    const optionIn = document.createElement("option");
    optionIn.value = p.id;
    optionIn.textContent = p.name;
    selectIn.appendChild(optionIn);

    const optionOut = document.createElement("option");
    optionOut.value = p.id;
    optionOut.textContent = p.name;
    selectOut.appendChild(optionOut);
  });

  btn.addEventListener("click", async () => {
    const inId = selectIn.value;
    const outId = selectOut.value;
    const minute = prompt("¿Minuto del cambio?", "0");

    if (!inId || !outId || inId === outId || isNaN(parseInt(minute))) return;

    const subEvent = {
      type: "sub",
      time: parseInt(minute),
      extra: { in: inId, out: outId }
    };

    await db.collection("games").doc(gameId).update({
      events: firebase.firestore.FieldValue.arrayUnion(subEvent)
    });

    alert("Cambio registrado ✅");
  });
}


async function renderFasePost(events) {
  console.log('Renderizando FASE POST', events);
  const timeline = document.getElementById("timeline");
  timeline.innerHTML = "";

  // Obtener nombres de jugadores
  const snap = await db.collection("players").get();
  const players = {};
  snap.forEach(doc => {
    players[doc.id] = doc.data().name;
  });

  // Eventos base
  const sortedEvents = [
    { type: "start", time: 0 },
    ...events,
    { type: "end", time: 90 }
  ].sort((a, b) => a.time - b.time);

  // Renderizar
  sortedEvents.forEach(event => {
    const item = document.createElement("div");
    item.className = "timeline-item";

    const content = document.createElement("div");
    content.className = "event-content";

    let label = "";

    switch (event.type) {
      case "start":
        label = "🟢 Inicio";
        content.classList.add("left");
        break;
      case "end":
        label = "🔴 Final";
        content.classList.add("right");
        break;
      case "goal":
        label = `⚽ ${players[event.playerId] || "Jugador"} ${event.time}'`;
        content.classList.add("left");
        break;
      case "yellow":
        label = `🟨 ${players[event.playerId] || "Jugador"} ${event.time}'`;
        content.classList.add("right");
        break;
      case "red":
        label = `🟥 ${players[event.playerId] || "Jugador"} ${event.time}'`;
        content.classList.add("right");
        break;
      case "sub":
        const inName = players[event.extra?.in] || "Entra";
        const outName = players[event.extra?.out] || "Sale";
        label = `🔄 ${outName} ⇆ ${inName} ${event.time}'`;
        content.classList.add("left");
        break;
      default:
        label = `${event.type} ${event.time}'`;
        content.classList.add("right");
    }

    content.textContent = label;

    const line = document.createElement("div");
    line.className = "vertical-line";

    item.appendChild(content);
    item.appendChild(line);
    timeline.appendChild(item);
  });
}

// ✅ Ejecutar
cargarDatosDelPartido(gameId);



function enableDragAndDrop() {
  const lists = document.querySelectorAll('.player-list');

  lists.forEach(list => {
    list.addEventListener('dragover', e => e.preventDefault());
    list.addEventListener('drop', e => {
      e.preventDefault();
      const playerId = e.dataTransfer.getData("text/plain");
      const draggedEl = document.querySelector(`[data-id='${playerId}']`);
      if (draggedEl) list.appendChild(draggedEl);
    });
  });

  document.querySelectorAll('.player-card').forEach(card => {
    card.setAttribute('draggable', true);

    // Desktop drag
    card.addEventListener('dragstart', e => {
      e.dataTransfer.setData("text/plain", card.dataset.id);
    });

    // Mobile fallback (touch)
    card.addEventListener('touchstart', handleTouchStart, { passive: false });
    card.addEventListener('touchmove', handleTouchMove, { passive: false });
    card.addEventListener('touchend', handleTouchEnd, { passive: false });
  });
}

let touchEl = null;
function handleTouchStart(e) {
  touchEl = e.currentTarget.cloneNode(true);
  touchEl.style.position = 'absolute';
  touchEl.style.zIndex = '1000';
  touchEl.style.pointerEvents = 'none';
  document.body.appendChild(touchEl);
  moveAt(e.touches[0].pageX, e.touches[0].pageY);
  e.preventDefault();
}

function handleTouchMove(e) {
  moveAt(e.touches[0].pageX, e.touches[0].pageY);
  e.preventDefault();
}

function moveAt(x, y) {
  if (touchEl) {
    touchEl.style.left = x + 'px';
    touchEl.style.top = y + 'px';
  }
}

function handleTouchEnd(e) {
  if (!touchEl) return;

  const touch = e.changedTouches[0];
  const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
  const playerId = e.currentTarget.dataset.id;

  if (dropTarget && dropTarget.classList.contains('player-list')) {
    const original = document.querySelector(`[data-id='${playerId}']`);
    dropTarget.appendChild(original);
  }

  document.body.removeChild(touchEl);
  touchEl = null;
}