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

function linkCargado(link) {
  return !!link && !link.startsWith("PEGAR_");
}

function buildQtyOptions(selectEl, cantidadesValidas, disabledLabel) {
  selectEl.innerHTML = "";
  if (disabledLabel) {
    const opt = document.createElement("option");
    opt.value = "0";
    opt.textContent = disabledLabel;
    selectEl.appendChild(opt);
    selectEl.disabled = true;
    return;
  }

  const opt0 = document.createElement("option");
  opt0.value = "0";
  opt0.textContent = "0";
  selectEl.appendChild(opt0);

  cantidadesValidas.forEach((i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i;
    selectEl.appendChild(opt);
  });

  selectEl.disabled = cantidadesValidas.length === 0;
}

function setupRow(key, data) {
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
    buildQtyOptions(qtySelect, [], data.agotada ? "Agotado" : "—");
    return;
  }

  const cantidadesValidas = Object.keys(data.mpLinks || {})
    .map(Number)
    .filter((qty) => (data.stock ? qty <= data.stock : true))
    .filter((qty) => linkCargado(data.mpLinks[qty]))
    .sort((a, b) => a - b);

  buildQtyOptions(qtySelect, cantidadesValidas, null);
  qtySelect.addEventListener("change", updateTotal);
}

function updateTotal() {
  const p1qty = parseInt(document.getElementById("p1-qty").value, 10) || 0;
  const p2qty = parseInt(document.getElementById("p2-qty").value, 10) || 0;
  const p1total = p1qty * (CONFIG.preventa1.precio || 0);
  const p2total = p2qty * (CONFIG.preventa2.precio || 0);
  document.getElementById("total-general").textContent = formatPrice(p1total + p2total);
}

function pickActiveSelection() {
  const p1qty = parseInt(document.getElementById("p1-qty").value, 10) || 0;
  const p2qty = parseInt(document.getElementById("p2-qty").value, 10) || 0;

  if (p1qty > 0) {
    return {
      data: CONFIG.preventa1,
      cantidad: p1qty,
      total: p1qty * CONFIG.preventa1.precio,
      mpLink: (CONFIG.preventa1.mpLinks || {})[p1qty],
    };
  }
  if (p2qty > 0) {
    return {
      data: CONFIG.preventa2,
      cantidad: p2qty,
      total: p2qty * CONFIG.preventa2.precio,
      mpLink: (CONFIG.preventa2.mpLinks || {})[p2qty],
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

    if (!linkCargado(seleccion.mpLink)) {
      showToast("Falta cargar el link de Mercado Pago para esa cantidad en config.js");
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

      window.location.href = seleccion.mpLink;
    } catch (err) {
      showToast("Hubo un error al registrar tus datos. Probá de nuevo.");
      buyBtn.disabled = false;
      buyBtn.textContent = "ADQUIRIR";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fillHeaderAndDescription();
  setupRow("p1", CONFIG.preventa1);
  setupRow("p2", CONFIG.preventa2);
  setupBuyForm();
  updateTotal();
});
