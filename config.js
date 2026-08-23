// ============================================================
// CONFIGURACIÓN DEL EVENTO Y LAS ENTRADAS
// Editá SOLO este archivo para actualizar precios, stock,
// links de Mercado Pago o agotar/habilitar preventas.
//
// IMPORTANTE sobre los links de Mercado Pago:
// Los "Links de pago" simples de Mercado Pago son de MONTO FIJO,
// no tienen selector de cantidad. Por eso hay que crear un link
// distinto para cada cantidad de entradas (1, 2, 3...) con el
// monto ya multiplicado. El sitio solo va a ofrecer como opción
// las cantidades que tengan un link cargado acá abajo.
//
// Ejemplo: si preventa 1 vale $6.500, tenés que crear en
// Mercado Pago un link de $6.500 (1 entrada), uno de $13.000
// (2 entradas), uno de $19.500 (3 entradas), etc.
// ============================================================

const CONFIG = {
  evento: {
    nombre: "PUCHE + JOYZE + FENICIA RUBÍ",
    fecha: "Jueves 25 de Septiembre - 20:00 hrs.",
    // Fecha y hora exacta (con huso horario de Argentina) para el contador.
    fechaISO: "2026-09-25T20:00:00-03:00",
    lugar: "Moscú",
    direccion: "Av. Raúl Scalabrini Ortiz 343, CABA",
  },

  organizador: {
    texto: "Evento organizado por La Fechita",
  },

  // Si querés mostrar un flyer/banner, poné el nombre del archivo de imagen
  // (subilo a la misma carpeta del sitio). Si lo dejás en null, se muestra
  // una placa con el nombre del evento en su lugar.
  flyerImagen: null, // ejemplo: "flyer.jpg"

  // Email donde vas a recibir los datos de cada compra (nombre + email del comprador)
  emailDestino: "agustinpucheta3@gmail.com",

  preventa1: {
    nombre: "Preventa 1",
    precio: 6500,
    stock: 10,
    activa: true,      // true = se puede comprar
    agotada: false,    // pasar a true cuando se agote -> muestra "AGOTADO" y bloquea el desplegable

    // Un link de Mercado Pago por cada cantidad de entradas.
    // Agregá o quitá filas según hasta cuántas entradas quieras permitir por compra.
    mpLinks: {
      1: "https://mpago.la/1V48Lzw",
      2: "https://mpago.la/2Xu3Upz",
      3: "https://mpago.la/32G1N26",
      4: "PEGAR_LINK_4_ENTRADAS",
    },
  },

  preventa2: {
    nombre: "Preventa 2",
    precio: 8000,
    stock: null,        // completar cuando definan el stock
    activa: false,      // pasar a true cuando se agote la preventa 1 (y ya tengas precios + links cargados)
    agotada: false,

    mpLinks: {
      1: "PEGAR_LINK_2_1_ENTRADA",
      2: "PEGAR_LINK_2_2_ENTRADAS",
      3: "PEGAR_LINK_2_3_ENTRADAS",
      4: "PEGAR_LINK_2_4_ENTRADAS",
    },
  },
};

// Permite que la función de Netlify (netlify/functions/mp-webhook.js)
// reutilice el mismo emailDestino sin duplicarlo. No afecta al navegador.
if (typeof module !== "undefined") {
  module.exports = CONFIG;
}
