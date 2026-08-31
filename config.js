// ============================================================
// CONFIGURACIÓN DEL EVENTO Y LAS ENTRADAS
// Editá SOLO este archivo para actualizar precios, stock,
// o agotar/habilitar preventas.
//
// Ya NO hace falta crear links de pago a mano en Mercado Pago:
// el monto se genera automáticamente según precio x cantidad.
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
    texto: "Evento organizado por Confluencia",
  },

  // Si querés mostrar un flyer/banner, poné el nombre del archivo de imagen
  // (subilo a la misma carpeta del sitio). Si lo dejás en null, se muestra
  // una placa con el nombre del evento en su lugar.
  flyerImagen: null, // ejemplo: "flyer.jpg"

  // Email donde vas a recibir los datos de cada compra (nombre + email del comprador)
  emailDestino: "agustinpucheta3@gmail.com",

  // Cantidad máxima de entradas que se pueden elegir por compra
  maxPorCompra: 8,

  preventa1: {
    nombre: "Preventa 1",
    precio: 6500,
    stock: 10,
    activa: true,      // true = se puede comprar
    agotada: false,    // pasar a true cuando se agote -> muestra "AGOTADO" y bloquea el desplegable
  },

  preventa2: {
    nombre: "Preventa 2",
    precio: 8000,
    stock: null,        // completar cuando definan el stock
    activa: false,      // pasar a true cuando se agote la preventa 1
    agotada: false,
  },
};

// Permite que las funciones de Netlify reutilicen esta misma
// configuración sin duplicarla. No afecta al navegador.
if (typeof module !== "undefined") {
  module.exports = CONFIG;
}
