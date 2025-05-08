const QRCode = require("qrcode");

exports.generateQRCodeBuffer = async (text) => {
  return await QRCode.toBuffer(text);
};
