// ============================================================
// Webhook de confirmación de pago (Mercado Pago -> Netlify).
// No hace falta tocar este archivo.
//
// Qué hace: Mercado Pago avisa acá cada vez que cambia el estado
// de un pago creado por create-preference.js. Si el pago está "approved":
//   1. Busca, por la referencia única del pago (external_reference),
//      los datos del comprador guardados al crear el pago.
//   2. Si la encuentra, le manda a ESA persona un mail con su
//      tarjeta (recién ahora que el pago está confirmado).
//   3. Siempre te avisa a vos también, con los datos del pago y,
//      si se encontró, a quién se le mandó la tarjeta.
//
// Para que funcione necesitás, en el panel de Netlify del sitio:
//   Site configuration > Environment variables > agregar
//   MP_ACCESS_TOKEN = tu Access Token de producción de Mercado Pago
//   RESEND_API_KEY  = tu API key de Resend (resend.com, gratis)
//   BLOBS_SITE_ID   = el Project ID / Site ID de tu sitio
//   BLOBS_TOKEN     = un Personal Access Token generado en tu cuenta
//
// Y en el panel de desarrolladores de Mercado Pago, configurar el
// webhook de la app apuntando a (en "Modo productivo"):
//   https://TU-SITIO.netlify.app/.netlify/functions/mp-webhook
// (evento: Pagos)
// ============================================================

const { getStore } = require("@netlify/blobs");
const CONFIG = require("../../config.js");

function getPendingStore() {
  return getStore({
    name: "pending-purchases",
    siteID: process.env.BLOBS_SITE_ID,
    token: process.env.BLOBS_TOKEN,
  });
}

async function buscarCompradorPorReferencia(referencia) {
  if (!referencia) return null;

  if (!process.env.BLOBS_SITE_ID || !process.env.BLOBS_TOKEN) {
    console.error("Falta configurar BLOBS_SITE_ID / BLOBS_TOKEN en Netlify");
    return null;
  }

  try {
    const store = getPendingStore();
    const key = `ref-${referencia}`;
    const comprador = await store.get(key, { type: "json" });

    if (comprador) {
      await store.delete(key);
    }

    return comprador;
  } catch (err) {
    console.error("Error buscando comprador por referencia:", err);
    return null;
  }
}

async function enviarTarjeta(comprador) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Falta configurar RESEND_API_KEY en Netlify");
    return false;
  }

  const siteUrl = process.env.URL || "https://lafechitadelospibes.netlify.app";
  const qty = parseInt(comprador.cantidad, 10) || 1;
  const cantidadTexto = qty === 1 ? "1 entrada" : `${qty} entradas`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
      <p style="font-size: 16px;">Muchas gracias <strong>${comprador.nombre}</strong> por haber comprado ${cantidadTexto}.</p>
      <p style="font-size: 16px;">Aquí tienes tu tarjeta:</p>
      <img src="${siteUrl}/tarjeta.png" alt="Entrada" style="width:100%; height:auto; border-radius: 4px; margin-top: 8px;" />
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Confluencia <onboarding@resend.dev>",
      to: comprador.email,
      subject: `Tu entrada — ${CONFIG.evento.nombre}`,
      html,
    }),
  });

  if (!res.ok) {
    console.error("Error de Resend:", await res.text());
    return false;
  }
  return true;
}

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

    const comprador = await buscarCompradorPorReferencia(payment.external_reference);

    let tarjetaEnviada = false;
    if (comprador) {
      tarjetaEnviada = await enviarTarjeta(comprador);
    }

    const payload = {
      _subject: `✅ Pago aprobado - $${payment.transaction_amount}`,
      monto: payment.transaction_amount,
      descripcion: payment.description || "",
      email_cuenta_mp_pagador: (payment.payer && payment.payer.email) || "—",
      fecha_aprobacion: payment.date_approved,
      payment_id: paymentId,
      comprador_identificado: comprador ? `${comprador.nombre} <${comprador.email}>` : "no encontrado",
      tarjeta_enviada: comprador ? (tarjetaEnviada ? "sí" : "no (revisar RESEND_API_KEY)") : "—",
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
