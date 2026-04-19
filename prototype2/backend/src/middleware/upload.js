const fs = require("fs");
const path = require("path");
const multer = require("multer");

function createUpload(subfolder, filenameBuilder) {
  const uploadDir = path.join(__dirname, "..", "..", "uploads", subfolder);
  fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || ".jpg");
      cb(null, filenameBuilder(req, file, ext));
    },
  });

  return multer({
    storage,
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });
}

const studentCardUpload = createUpload("student-cards", (req, file, ext) => {
  const safeStudentId = String(req.body.studentId || req.body.student_id || "student").replace(
    /[^a-zA-Z0-9_-]/g,
    ""
  );
  return `${Date.now()}-${safeStudentId}${ext}`;
});

const equipmentImageUpload = createUpload("equipment-images", (req, file, ext) => {
  const safeCode = String(req.body.code || req.body.qrValue || req.params.id || "equipment").replace(
    /[^a-zA-Z0-9_-]/g,
    ""
  );
  return `${Date.now()}-${safeCode}${ext}`;
});

module.exports = {
  uploadStudentCard: studentCardUpload.single("studentCardImage"),
  uploadEquipmentImage: equipmentImageUpload.single("equipmentImage"),
};
