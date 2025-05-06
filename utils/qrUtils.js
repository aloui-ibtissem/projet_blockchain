const QRCode = require("qrcode");

exports.generateQRCode = async (url) => {
  try {
    return await QRCode.toDataURL(url);
  } catch (err) {
    throw new Error("Erreur génération QR Code");
  }
};
