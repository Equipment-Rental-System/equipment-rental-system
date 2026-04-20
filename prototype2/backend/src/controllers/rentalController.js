const rentalService = require("../services/rentalService");

async function listRentals(req, res) {
  const rentals = await rentalService.listRentals(req.user, req.query);
  res.json(rentals);
}

async function listPending(req, res) {
  const rentals = await rentalService.listPendingRentalRequests();
  res.json(rentals);
}

async function listReturnPending(req, res) {
  const rentals = await rentalService.listReturnPending();
  res.json(rentals);
}

async function listOverdue(req, res) {
  const rentals = await rentalService.listOverdueRentals();
  res.json(rentals);
}

async function requestRental(req, res) {
  const rental = await rentalService.requestRental({
    userId: req.user.id,
    equipmentId: req.body.equipmentId,
    dueDate: req.body.dueDate,
    note: req.body.note,
  });

  res.status(201).json({
    message: "대여 요청이 접수되었습니다. 관리자 승인 후 대여가 시작됩니다.",
    rental,
  });
}

async function approveRental(req, res) {
  const rental = await rentalService.approveRental({
    rentalId: req.params.id,
    adminId: req.user.id,
    adminNote: req.body.adminNote,
  });

  res.json({
    message: "대여 요청을 승인했습니다.",
    rental,
  });
}

async function rejectRental(req, res) {
  const rental = await rentalService.rejectRental({
    rentalId: req.params.id,
    adminId: req.user.id,
    adminNote: req.body.adminNote,
  });

  res.json({
    message: "대여 요청을 거절했습니다.",
    rental,
  });
}

async function requestExtension(req, res) {
  const rental = await rentalService.requestExtension({
    rentalId: req.params.id,
    user: req.user,
    requestedDueDate: req.body.requestedDueDate,
    note: req.body.note,
  });

  res.json({
    message: "연장 요청이 접수되었습니다.",
    rental,
  });
}

async function approveExtension(req, res) {
  const rental = await rentalService.approveExtension({
    rentalId: req.params.id,
    adminId: req.user.id,
    adminNote: req.body.adminNote,
  });

  res.json({
    message: "연장 요청을 승인했습니다.",
    rental,
  });
}

async function rejectExtension(req, res) {
  const rental = await rentalService.rejectExtension({
    rentalId: req.params.id,
    adminId: req.user.id,
    adminNote: req.body.adminNote,
  });

  res.json({
    message: "연장 요청을 거절했습니다.",
    rental,
  });
}

async function requestReturn(req, res) {
  const rental = await rentalService.requestReturn({
    rentalId: req.params.id,
    user: req.user,
  });

  res.json({
    message: "반납 요청이 접수되었습니다. 관리자 실물 확인 후 최종 상태가 변경됩니다.",
    rental,
  });
}

async function approveReturn(req, res) {
  const rental = await rentalService.approveReturn({
    rentalId: req.params.id,
    adminId: req.user.id,
    adminNote: req.body.adminNote,
  });

  res.json({
    message: "반납을 최종 승인했습니다.",
    rental,
  });
}

async function markInspection(req, res) {
  const rental = await rentalService.markInspection({
    rentalId: req.params.id,
    adminId: req.user.id,
    adminNote: req.body.adminNote,
  });

  res.json({
    message: "점검 필요 상태로 처리했습니다.",
    rental,
  });
}

async function markRepair(req, res) {
  const rental = await rentalService.markRepair({
    rentalId: req.params.id,
    adminId: req.user.id,
    adminNote: req.body.adminNote,
  });

  res.json({
    message: "수리 필요 상태로 처리했습니다.",
    rental,
  });
}

module.exports = {
  listRentals,
  listPending,
  listReturnPending,
  listOverdue,
  requestRental,
  approveRental,
  rejectRental,
  requestExtension,
  approveExtension,
  rejectExtension,
  requestReturn,
  approveReturn,
  markInspection,
  markRepair,
};

