const QRCode = require("qrcode");

exports.generateQRCodeBuffer = async (text) => {
  try {
    return await QRCode.toBuffer(text);
  } catch (err) {
    console.error("Erreur génération QR Code:", err.message);
    throw err;
  }
};
