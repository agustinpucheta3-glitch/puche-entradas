// ============================================================
// Guarda los datos del comprador (nombre, email, cantidad) apenas
// toca "ADQUIRIR", ANTES de ir a pagar. No manda ningún mail acá.
//
// Sirve para que, cuando Mercado Pago confirme el pago (mp-webhook.js),
// podamos saber a quién corresponde ese pago y mandarle la tarjeta
// recién en ese momento — no antes de que pague.
//
// No hace falta tocar este archivo.
// ============================================================

const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  try {
    const { nombre, email, cantidad, total } = JSON.parse(event.body || "{}");

    if (!email || !nombre || !total) {
      return { statusCode: 400, body: "faltan datos" };
    }

    const store = getStore("pending-purchases");
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
