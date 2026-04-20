const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const equipmentController = require("../controllers/equipmentController");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { uploadEquipmentImage } = require("../middleware/upload");

const router = express.Router();

router.get("/", requireAuth, asyncHandler(equipmentController.listEquipments));
router.get("/qr/:value", requireAuth, asyncHandler(equipmentController.getEquipmentByQr));
router.get("/:id/qr", requireAuth, asyncHandler(equipmentController.getEquipmentQrImage));
router.get("/:id", requireAuth, asyncHandler(equipmentController.getEquipment));
router.post("/", requireAuth, requireAdmin, uploadEquipmentImage, asyncHandler(equipmentController.createEquipment));
router.put("/:id", requireAuth, requireAdmin, uploadEquipmentImage, asyncHandler(equipmentController.updateEquipment));
router.put(
  "/:id/status",
  requireAuth,
  requireAdmin,
  asyncHandler(equipmentController.updateEquipmentStatus)
);
router.delete("/:id", requireAuth, requireAdmin, asyncHandler(equipmentController.deleteEquipment));

module.exports = router;
