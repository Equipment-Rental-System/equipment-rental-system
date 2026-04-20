const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const { toPublicUploadPath } = require("./uploadPath");

const QR_UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "qr-codes");

fs.mkdirSync(QR_UPLOAD_DIR, { recursive: true });

function sanitizeSegment(value, fallback = "equipment") {
  return String(value || fallback)
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || fallback;
}

function buildQrFilename({ code, qrValue }) {
  const base = sanitizeSegment(code || qrValue || "equipment");
  return `${base}.png`;
}

async function ensureQrImageAsset({ code, qrValue }) {
  const filename = buildQrFilename({ code, qrValue });
  const filePath = path.join(QR_UPLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) {
    await QRCode.toFile(filePath, qrValue, {
      margin: 2,
      width: 480,
      color: {
        dark: "#1b1f28",
        light: "#ffffff",
      },
    });
  }

  return toPublicUploadPath(filePath);
}

async function getQrCodeDataUrl(qrValue) {
  return QRCode.toDataURL(qrValue, {
    margin: 2,
    width: 320,
    color: {
      dark: "#1b1f28",
      light: "#ffffff",
    },
  });
}

module.exports = {
  ensureQrImageAsset,
  getQrCodeDataUrl,
};
