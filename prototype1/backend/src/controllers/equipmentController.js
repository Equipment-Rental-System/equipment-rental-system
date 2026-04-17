const QRCode = require("qrcode");
const equipmentService = require("../services/equipmentService");
const { toPublicUploadPath } = require("../utils/uploadPath");

async function listEquipments(req, res) {
  const equipments = await equipmentService.listEquipments(req.query);
  res.json(equipments);
}

async function getEquipment(req, res) {
  const equipment = await equipmentService.getEquipmentById(req.params.id);
  res.json(equipment);
}

async function getEquipmentByQr(req, res) {
  const equipment = await equipmentService.getEquipmentByQrValue(req.params.value);
  res.json(equipment);
}

async function getEquipmentQrImage(req, res) {
  const equipment = await equipmentService.getEquipmentById(req.params.id);
  const qrImage = await QRCode.toDataURL(equipment.qrValue, {
    margin: 2,
    width: 320,
  });

  res.json({
    equipmentId: equipment.id,
    code: equipment.code,
    qrValue: equipment.qrValue,
    qrImage,
  });
}

async function createEquipment(req, res) {
  const payload = {
    ...req.body,
    imagePath: req.file ? toPublicUploadPath(req.file.path) : req.body.imagePath,
  };
  const equipment = await equipmentService.createEquipment(payload);
  res.status(201).json({
    message: "기자재가 등록되었습니다.",
    equipment,
  });
}

async function updateEquipment(req, res) {
  const payload = {
    ...req.body,
    imagePath: req.file ? toPublicUploadPath(req.file.path) : req.body.imagePath,
  };
  const equipment = await equipmentService.updateEquipment(req.params.id, payload);
  res.json({
    message: "기자재 정보가 수정되었습니다.",
    equipment,
  });
}

async function updateEquipmentStatus(req, res) {
  const equipment = await equipmentService.updateEquipmentStatus(req.params.id, req.body.status);
  res.json({
    message: "기자재 상태가 업데이트되었습니다.",
    equipment,
  });
}

async function deleteEquipment(req, res) {
  await equipmentService.deleteEquipment(req.params.id);
  res.json({
    message: "기자재가 삭제되었습니다.",
  });
}

module.exports = {
  listEquipments,
  getEquipment,
  getEquipmentByQr,
  getEquipmentQrImage,
  createEquipment,
  updateEquipment,
  updateEquipmentStatus,
  deleteEquipment,
};
