// ============================================================
// Envía al comprador un mail de agradecimiento con la tarjeta
// (entrada) embebida como imagen. No hace falta tocar este archivo.
//
// Para que funcione necesitás, en el panel de Netlify del sitio:
//   Site settings > Environment variables > agregar
//   RESEND_API_KEY = tu API key de Resend (resend.com, gratis)
// ============================================================

const CONFIG = require("../../config.js");

exports.handler = async (event) => {
  try {
    const { nombre, email, cantidad } = JSON.parse(event.body || "{}");

    if (!email || !nombre) {
      return { statusCode: 400, body: "faltan datos" };
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("Falta configurar RESEND_API_KEY en Netlify");
      return { statusCode: 200, body: "falta RESEND_API_KEY" };
    }

    const siteUrl = process.env.URL || "https://lafechitadelospibes.netlify.app";
    const qty = parseInt(cantidad, 10) || 1;
    const cantidadTexto = qty === 1 ? "1 entrada" : `${qty} entradas`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
        <p style="font-size: 16px;">Muchas gracias <strong>${nombre}</strong> por haber comprado ${cantidadTexto}.</p>
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
        to: email,
        subject: `Tu entrada — ${CONFIG.evento.nombre}`,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Error de Resend:", errText);
      return { statusCode: 200, body: "error resend" };
    }

    return { statusCode: 200, body: "ok" };
  } catch (err) {
    console.error(err);
    return { statusCode: 200, body: "error manejado" };
  }
};
