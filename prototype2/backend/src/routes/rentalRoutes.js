const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const rentalController = require("../controllers/rentalController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, asyncHandler(rentalController.listRentals));
router.get("/pending", requireAuth, requireAdmin, asyncHandler(rentalController.listPending));
router.get(
  "/return-pending",
  requireAuth,
  requireAdmin,
  asyncHandler(rentalController.listReturnPending)
);
router.get("/overdue", requireAuth, requireAdmin, asyncHandler(rentalController.listOverdue));
router.post("/request", requireAuth, asyncHandler(rentalController.requestRental));
router.post("/:id/approve", requireAuth, requireAdmin, asyncHandler(rentalController.approveRental));
router.post("/:id/reject", requireAuth, requireAdmin, asyncHandler(rentalController.rejectRental));
router.post("/:id/extend-request", requireAuth, asyncHandler(rentalController.requestExtension));
router.post(
  "/:id/approve-extension",
  requireAuth,
  requireAdmin,
  asyncHandler(rentalController.approveExtension)
);
router.post(
  "/:id/reject-extension",
  requireAuth,
  requireAdmin,
  asyncHandler(rentalController.rejectExtension)
);
router.post("/:id/return-request", requireAuth, asyncHandler(rentalController.requestReturn));
router.post(
  "/:id/approve-return",
  requireAuth,
  requireAdmin,
  asyncHandler(rentalController.approveReturn)
);
router.post(
  "/:id/mark-inspection",
  requireAuth,
  requireAdmin,
  asyncHandler(rentalController.markInspection)
);
router.post("/:id/mark-repair", requireAuth, requireAdmin, asyncHandler(rentalController.markRepair));

module.exports = router;
