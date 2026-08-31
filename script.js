// ============================================================
// No hace falta tocar este archivo. Toda la configuración
// (precios, stock, links, agotar/habilitar) está en config.js
// ============================================================

function formatPrice(n) {
  if (n === null || n === undefined) return "A confirmar";
  return "$" + n.toLocaleString("es-AR");
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3500);
}

function fillHeaderAndDescription() {
  const evt = CONFIG.evento;
  document.title = `${evt.nombre} — Entradas`;

  ["evt-nombre", "evt-nombre-2"].forEach((id) => {
    document.getElementById(id).textContent = evt.nombre;
  });
  ["evt-fecha", "evt-fecha-2"].forEach((id) => {
    document.getElementById(id).textContent = evt.fecha;
  });
  ["evt-lugar", "evt-lugar-2"].forEach((id) => {
    document.getElementById(id).textContent = evt.lugar;
  });
  ["evt-direccion", "evt-direccion-2"].forEach((id) => {
    document.getElementById(id).textContent = evt.direccion;
  });

  document.getElementById("org-texto").textContent = CONFIG.organizador.texto;

  const flyerCard = document.getElementById("flyer-card");
  if (CONFIG.flyerImagen) {
    flyerCard.innerHTML = `<img src="${CONFIG.flyerImagen}" alt="${evt.nombre}">`;
  } else {
    document.getElementById("flyer-fallback-text").innerHTML = evt.nombre.replace(/\s*\+\s*/g, "<br>+ ");
  }
}

function buildQtyOptions(selectEl, max, disabledLabel) {
  selectEl.innerHTML = "";
  if (disabledLabel) {
    const opt = document.createElement("option");
    opt.value = "0";
    opt.textContent = disabledLabel;
    selectEl.appendChild(opt);
    selectEl.disabled = true;
    return;
  }

  for (let i = 0; i <= max; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i;
    selectEl.appendChild(opt);
  }

  selectEl.disabled = false;
}

function setupRow(key, data, maxPorCompra) {
  const badgeEl = document.getElementById(`${key}-badge`);
  const precioEl = document.getElementById(`${key}-precio`);
  const qtySelect = document.getElementById(`${key}-qty`);

  precioEl.textContent = formatPrice(data.precio);

  const habilitada = data.activa && !data.agotada && data.precio !== null;

  if (data.agotada) {
    badgeEl.textContent = "Agotado";
    badgeEl.className = "badge soldout";
  } else if (!data.activa) {
    badgeEl.textContent = "Próximamente";
    badgeEl.className = "badge soon";
  } else {
    badgeEl.textContent = "Disponible";
    badgeEl.className = "badge";
  }

  if (!habilitada) {
    buildQtyOptions(qtySelect, 0, data.agotada ? "Agotado" : "—");
    return;
  }

  const tope = data.stock ? Math.min(maxPorCompra, data.stock) : maxPorCompra;
  buildQtyOptions(qtySelect, tope, null);
  qtySelect.addEventListener("change", updateTotal);
}

function updateTotal() {
  const p1qty = parseInt(document.getElementById("p1-qty").value, 10) || 0;
  const p2qty = parseInt(document.getElementById("p2-qty").value, 10) || 0;
  const p1total = p1qty * (CONFIG.preventa1.precio || 0);
  const p2total = p2qty * (CONFIG.preventa2.precio || 0);
  const totalEl = document.getElementById("total-general");
  totalEl.textContent = formatPrice(p1total + p2total);
  totalEl.classList.remove("pulse");
  void totalEl.offsetWidth;
  totalEl.classList.add("pulse");
}

function setupCountdown() {
  const bar = document.getElementById("countdown-bar");
  const target = new Date(CONFIG.evento.fechaISO).getTime();
  const label = bar.querySelector(".countdown-label");
  const units = bar.querySelector(".countdown-units");
  const elDays = document.getElementById("cd-days");
  const elHours = document.getElementById("cd-hours");
  const elMinutes = document.getElementById("cd-minutes");
  const elSeconds = document.getElementById("cd-seconds");

  const pad = (n) => String(n).padStart(2, "0");

  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      label.textContent = "¡La fechita ya empezó!";
      units.style.display = "none";
      clearInterval(timer);
      return;
    }
    elDays.textContent = pad(Math.floor(diff / 86400000));
    elHours.textContent = pad(Math.floor((diff / 3600000) % 24));
    elMinutes.textContent = pad(Math.floor((diff / 60000) % 60));
    elSeconds.textContent = pad(Math.floor((diff / 1000) % 60));
  }

  tick();
  const timer = setInterval(tick, 1000);
}

function pickActiveSelection() {
  const p1qty = parseInt(document.getElementById("p1-qty").value, 10) || 0;
  const p2qty = parseInt(document.getElementById("p2-qty").value, 10) || 0;

  if (p1qty > 0) {
    return {
      preventaKey: "preventa1",
      data: CONFIG.preventa1,
      cantidad: p1qty,
      total: p1qty * CONFIG.preventa1.precio,
    };
  }
  if (p2qty > 0) {
    return {
      preventaKey: "preventa2",
      data: CONFIG.preventa2,
      cantidad: p2qty,
      total: p2qty * CONFIG.preventa2.precio,
    };
  }
  return null;
}

function setupBuyForm() {
  const form = document.getElementById("buy-form");
  const buyBtn = document.getElementById("buy-btn");
  const nombreInput = document.getElementById("buyer-nombre");
  const emailInput = document.getElementById("buyer-email");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const seleccion = pickActiveSelection();
    if (!seleccion) {
      showToast("Elegí una cantidad de entradas antes de continuar.");
      return;
    }

    buyBtn.disabled = true;
    buyBtn.textContent = "Enviando...";

    const payload = {
      nombre: nombreInput.value,
      email: emailInput.value,
      preventa: seleccion.data.nombre,
      cantidad: seleccion.cantidad,
      total: seleccion.total,
      _subject: `Nueva compra - ${seleccion.data.nombre}`,
    };

    try {
      const res = await fetch(`https://formsubmit.co/ajax/${CONFIG.emailDestino}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("form error");

      const prefRes = await fetch("/.netlify/functions/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombreInput.value,
          email: emailInput.value,
          cantidad: seleccion.cantidad,
          preventaKey: seleccion.preventaKey,
        }),
      });

      const pref = await prefRes.json();

      if (!prefRes.ok || !pref.init_point) {
        throw new Error("No se pudo generar el pago");
      }

      window.location.href = pref.init_point;
    } catch (err) {
      showToast("Hubo un error al generar el pago. Probá de nuevo.");
      buyBtn.disabled = false;
      buyBtn.textContent = "ADQUIRIR";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fillHeaderAndDescription();
  setupRow("p1", CONFIG.preventa1, CONFIG.maxPorCompra);
  setupRow("p2", CONFIG.preventa2, CONFIG.maxPorCompra);
  setupBuyForm();
  setupCountdown();
  updateTotal();
});
