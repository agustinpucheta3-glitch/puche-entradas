// ============================================================
// Crea un pago dinámico en Mercado Pago (Preferencia de Checkout Pro)
// al tocar "ADQUIRIR". A diferencia de los links de pago fijos,
// este SÍ queda atado a nuestra aplicación y dispara el webhook
// (mp-webhook.js) cuando se aprueba.
//
// También guarda los datos del comprador en Netlify Blobs, bajo
// una referencia única que Mercado Pago nos devuelve en el pago
// aprobado — así sabemos exactamente a quién mandarle la tarjeta.
//
// No hace falta tocar este archivo.
// ============================================================

const { randomUUID } = require("crypto");
const { getStore } = require("@netlify/blobs");
const CONFIG = require("../../config.js");

function getPendingStore() {
  return getStore({
    name: "pending-purchases",
    siteID: process.env.BLOBS_SITE_ID,
    token: process.env.BLOBS_TOKEN,
  });
}

exports.handler = async (event) => {
  try {
    const { nombre, email, cantidad, preventaKey } = JSON.parse(event.body || "{}");

    if (!nombre || !email || !cantidad || !preventaKey) {
      return { statusCode: 400, body: JSON.stringify({ error: "faltan datos" }) };
    }

    const preventa = CONFIG[preventaKey];
    if (!preventa || !preventa.activa || preventa.agotada || preventa.precio == null) {
      return { statusCode: 400, body: JSON.stringify({ error: "preventa no disponible" }) };
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      console.error("Falta configurar MP_ACCESS_TOKEN en Netlify");
      return { statusCode: 500, body: JSON.stringify({ error: "falta configuracion de pago" }) };
    }

    const qty = parseInt(cantidad, 10) || 1;
    const reference = randomUUID();
    const siteUrl = process.env.URL || "https://lafechitadelospibes.netlify.app";

    if (process.env.BLOBS_SITE_ID && process.env.BLOBS_TOKEN) {
      try {
        const store = getPendingStore();
        await store.setJSON(`ref-${reference}`, {
          nombre,
          email,
          cantidad: qty,
          preventa: preventa.nombre,
          ts: Date.now(),
        });
      } catch (err) {
        console.error("Error guardando compra pendiente:", err);
      }
    }

    const prefRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: `${CONFIG.evento.nombre} - ${preventa.nombre}`,
            quantity: qty,
            unit_price: preventa.precio,
            currency_id: "ARS",
          },
        ],
        payer: { email, name: nombre },
        external_reference: reference,
        notification_url: `${siteUrl}/.netlify/functions/mp-webhook`,
        back_urls: {
          success: siteUrl,
          failure: siteUrl,
          pending: siteUrl,
        },
        auto_return: "approved",
      }),
    });

    const pref = await prefRes.json();

    if (!prefRes.ok || !pref.init_point) {
      console.error("Error creando preferencia de Mercado Pago:", pref);
      return { statusCode: 500, body: JSON.stringify({ error: "no se pudo crear el pago" }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ init_point: pref.init_point }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "error interno" }) };
  }
};
