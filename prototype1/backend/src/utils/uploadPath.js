const path = require("path");

function toPublicUploadPath(filePath) {
  if (!filePath) {
    return null;
  }

  const normalized = filePath.split(path.sep).join("/");
  const uploadsIndex = normalized.lastIndexOf("/uploads/");

  if (uploadsIndex >= 0) {
    return normalized.slice(uploadsIndex + 1);
  }

  if (normalized.startsWith("uploads/")) {
    return normalized;
  }

  return normalized;
}

module.exports = {
  toPublicUploadPath,
};
