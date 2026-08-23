// ============================================================
// Webhook de confirmación de pago (Mercado Pago -> Netlify).
// No hace falta tocar este archivo.
//
// Qué hace: Mercado Pago avisa acá cada vez que cambia el estado
// de un pago de tu cuenta. Si el pago está "approved", te manda
// un mail de confirmación real (no antes de que se acredite).
//
// Para que funcione necesitás, en el panel de Netlify del sitio:
//   Site settings > Environment variables > agregar
//   MP_ACCESS_TOKEN = tu Access Token de producción de Mercado Pago
//
// Y en el panel de desarrolladores de Mercado Pago, configurar el
// webhook de la app apuntando a:
//   https://TU-SITIO.netlify.app/.netlify/functions/mp-webhook
// (evento: Pagos)
// ============================================================

const CONFIG = require("../../config.js");

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    let body = {};
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (e) {
      body = {};
    }

    const topic = params.topic || params.type || body.type;
    const paymentId =
      params.id || params["data.id"] || (body.data && body.data.id) || body.id;

    if (!paymentId || (topic && topic !== "payment")) {
      return { statusCode: 200, body: "ignorado (no es un pago)" };
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      console.error("Falta configurar MP_ACCESS_TOKEN en Netlify");
      return { statusCode: 200, body: "falta MP_ACCESS_TOKEN" };
    }

    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const payment = await mpRes.json();

    if (payment.status !== "approved") {
      return { statusCode: 200, body: `estado: ${payment.status}` };
    }

    const payload = {
      _subject: `✅ Pago aprobado - $${payment.transaction_amount}`,
      monto: payment.transaction_amount,
      descripcion: payment.description || "",
      email_cuenta_mp_pagador: (payment.payer && payment.payer.email) || "—",
      fecha_aprobacion: payment.date_approved,
      payment_id: paymentId,
      nota: "Cruzá este monto y horario con el mail de 'nueva compra' para saber a quién mandarle la entrada.",
    };

    await fetch(`https://formsubmit.co/ajax/${CONFIG.emailDestino}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });

    return { statusCode: 200, body: "ok" };
  } catch (err) {
    console.error(err);
    return { statusCode: 200, body: "error manejado" };
  }
};
