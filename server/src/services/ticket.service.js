const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

/** Generate a unique ticket code */
const generateTicketCode = () =>
  uuidv4().replace(/-/g, '').toUpperCase().slice(0, 16);

/** Generate a QR code as base64 data URL */
const generateQrDataUrl = async (ticketCode) =>
  QRCode.toDataURL(ticketCode, {
    width:           300,
    margin:          2,
    color: { dark: '#0D3B15', light: '#FFFFFF' }
  });

module.exports = { generateTicketCode, generateQrDataUrl };
