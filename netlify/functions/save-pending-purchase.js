// ============================================================
// Guarda los datos del comprador (nombre, email, cantidad) apenas
// toca "ADQUIRIR", ANTES de ir a pagar. No manda ningún mail acá.
//
// Sirve para que, cuando Mercado Pago confirme el pago (mp-webhook.js),
// podamos saber a quién corresponde ese pago y mandarle la tarjeta
// recién en ese momento — no antes de que pague.
//
// Para que funcione necesitás, en el panel de Netlify del sitio:
//   Site configuration > Environment variables > agregar
//   BLOBS_SITE_ID = el Project ID / Site ID de tu sitio
//   BLOBS_TOKEN   = un Personal Access Token generado en tu cuenta
// ============================================================

const { getStore } = require("@netlify/blobs");

function getPendingStore() {
  return getStore({
    name: "pending-purchases",
    siteID: process.env.BLOBS_SITE_ID,
    token: process.env.BLOBS_TOKEN,
  });
}

exports.handler = async (event) => {
  try {
    const { nombre, email, cantidad, total } = JSON.parse(event.body || "{}");

    if (!email || !nombre || !total) {
      return { statusCode: 400, body: "faltan datos" };
    }

    if (!process.env.BLOBS_SITE_ID || !process.env.BLOBS_TOKEN) {
      console.error("Falta configurar BLOBS_SITE_ID / BLOBS_TOKEN en Netlify");
      return { statusCode: 200, body: "falta configuracion de blobs" };
    }

    const store = getPendingStore();
    const key = `amount-${total}`;

    const existing = (await store.get(key, { type: "json" })) || [];
    existing.push({ nombre, email, cantidad, ts: Date.now() });
    await store.setJSON(key, existing);

    return { statusCode: 200, body: "ok" };
  } catch (err) {
    console.error(err);
    return { statusCode: 200, body: "error manejado" };
  }
};
