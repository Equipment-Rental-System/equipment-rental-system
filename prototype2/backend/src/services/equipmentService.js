const pool = require("../config/db");
const {
  EQUIPMENT_STATUS,
  RENTAL_REQUEST_BLOCKING_STATUSES,
} = require("../utils/constants");
const { ensureQrImageAsset } = require("../utils/qr");

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function parseComponents(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function serializeComponents(value) {
  return JSON.stringify(parseComponents(value));
}

function mapCurrentRental(row) {
  if (!row || !row.rental_id) {
    return null;
  }

  return {
    id: row.rental_id,
    userId: row.rental_user_id,
    userName: row.rental_user_name,
    studentId: row.rental_student_id,
    dueDate: row.rental_due_date,
    status: row.rental_status,
  };
}

function mapEquipment(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    code: row.code,
    qrValue: row.qr_value,
    qrImagePath: row.qr_image_path,
    imagePath: row.image_path,
    status: row.status,
    location: row.location,
    components: parseComponents(row.components),
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    currentRental: mapCurrentRental(row),
  };
}

function validateStatus(status) {
  if (!Object.values(EQUIPMENT_STATUS).includes(status)) {
    throw createError("유효하지 않은 기자재 상태값입니다.");
  }
}

function buildListFilters(query = {}) {
  const clauses = [];
  const values = [];

  if (query.status) {
    clauses.push("e.status = ?");
    values.push(query.status);
  }

  if (query.category) {
    clauses.push("e.category = ?");
    values.push(query.category);
  }

  if (query.search) {
    clauses.push("(e.name LIKE ? OR e.code LIKE ? OR e.location LIKE ?)");
    values.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`);
  }

  return {
    whereClause: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    values,
  };
}

async function listEquipments(query = {}) {
  const filters = buildListFilters(query);
  const [rows] = await pool.query(
    `SELECT e.*,
            r.id AS rental_id,
            r.user_id AS rental_user_id,
            r.due_date AS rental_due_date,
            r.status AS rental_status,
            u.name AS rental_user_name,
            u.student_id AS rental_student_id
     FROM equipments e
     LEFT JOIN rentals r
       ON r.id = (
         SELECT r2.id
         FROM rentals r2
         WHERE r2.equipment_id = e.id
           AND r2.status IN (${RENTAL_REQUEST_BLOCKING_STATUSES.map(() => "?").join(", ")})
         ORDER BY r2.id DESC
         LIMIT 1
       )
     LEFT JOIN users u ON u.id = r.user_id
     ${filters.whereClause}
     ORDER BY FIELD(
       e.status,
       'RENTAL_PENDING',
       'RETURN_PENDING',
       'OVERDUE',
       'RENTED',
       'INSPECTION_REQUIRED',
       'REPAIR',
       'AVAILABLE'
     ), e.created_at DESC`,
    [...RENTAL_REQUEST_BLOCKING_STATUSES, ...filters.values]
  );

  return rows.map(mapEquipment);
}

async function getEquipmentById(id) {
  const [rows] = await pool.query(
    `SELECT e.*,
            r.id AS rental_id,
            r.user_id AS rental_user_id,
            r.due_date AS rental_due_date,
            r.status AS rental_status,
            u.name AS rental_user_name,
            u.student_id AS rental_student_id
     FROM equipments e
     LEFT JOIN rentals r
       ON r.id = (
         SELECT r2.id
         FROM rentals r2
         WHERE r2.equipment_id = e.id
           AND r2.status IN (${RENTAL_REQUEST_BLOCKING_STATUSES.map(() => "?").join(", ")})
         ORDER BY r2.id DESC
         LIMIT 1
       )
     LEFT JOIN users u ON u.id = r.user_id
     WHERE e.id = ?`,
    [...RENTAL_REQUEST_BLOCKING_STATUSES, id]
  );

  if (!rows.length) {
    throw createError("기자재를 찾을 수 없습니다.", 404);
  }

  return mapEquipment(rows[0]);
}

async function getEquipmentByQrValue(qrValue) {
  const [rows] = await pool.query(
    "SELECT id FROM equipments WHERE qr_value = ? OR code = ? LIMIT 1",
    [qrValue, qrValue]
  );

  if (!rows.length) {
    throw createError("존재하지 않는 QR 코드입니다.", 404);
  }

  return getEquipmentById(rows[0].id);
}

async function createEquipment(payload) {
  const status = payload.status || EQUIPMENT_STATUS.AVAILABLE;
  validateStatus(status);

  if (!payload.name || !payload.category || !payload.code) {
    throw createError("기자재명, 종류, 고유 식별 코드는 필수입니다.");
  }

  const qrValue = payload.qrValue || payload.code;
  const qrImagePath = await ensureQrImageAsset({
    code: payload.code,
    qrValue,
  });

  try {
    const [result] = await pool.query(
      `INSERT INTO equipments
        (name, category, code, qr_value, qr_image_path, image_path, status, location, components, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.name,
        payload.category,
        payload.code,
        qrValue,
        qrImagePath,
        payload.imagePath || null,
        status,
        payload.location || "",
        serializeComponents(payload.components),
        payload.description || "",
      ]
    );

    return getEquipmentById(result.insertId);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw createError("중복된 기자재 코드 또는 QR 값입니다.");
    }
    throw error;
  }
}

async function updateEquipment(id, payload) {
  const current = await getEquipmentById(id);
  const nextCode = payload.code !== undefined ? payload.code : current.code;
  const nextQrValue =
    payload.qrValue !== undefined
      ? payload.qrValue
      : payload.code !== undefined
        ? payload.code
        : current.qrValue;

  const shouldRefreshQr =
    payload.code !== undefined ||
    payload.qrValue !== undefined ||
    !current.qrImagePath;

  const nextQrImagePath = shouldRefreshQr
    ? await ensureQrImageAsset({
        code: nextCode,
        qrValue: nextQrValue,
      })
    : current.qrImagePath;

  const fields = [];
  const values = [];

  if (payload.name !== undefined) {
    fields.push("name = ?");
    values.push(payload.name);
  }
  if (payload.category !== undefined) {
    fields.push("category = ?");
    values.push(payload.category);
  }
  if (payload.code !== undefined) {
    fields.push("code = ?");
    values.push(payload.code);
  }
  if (payload.qrValue !== undefined) {
    fields.push("qr_value = ?");
    values.push(payload.qrValue);
  } else if (payload.code !== undefined) {
    fields.push("qr_value = ?");
    values.push(payload.code);
  }
  if (payload.status !== undefined) {
    validateStatus(payload.status);
    fields.push("status = ?");
    values.push(payload.status);
  }
  if (payload.imagePath !== undefined) {
    fields.push("image_path = ?");
    values.push(payload.imagePath || null);
  }
  if (payload.location !== undefined) {
    fields.push("location = ?");
    values.push(payload.location);
  }
  if (payload.components !== undefined) {
    fields.push("components = ?");
    values.push(serializeComponents(payload.components));
  }
  if (payload.description !== undefined) {
    fields.push("description = ?");
    values.push(payload.description);
  }
  if (shouldRefreshQr) {
    fields.push("qr_image_path = ?");
    values.push(nextQrImagePath);
  }

  if (!fields.length) {
    return getEquipmentById(id);
  }

  values.push(id);

  try {
    await pool.query(
      `UPDATE equipments
       SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      values
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw createError("중복된 기자재 코드 또는 QR 값입니다.");
    }
    throw error;
  }

  return getEquipmentById(id);
}

async function updateEquipmentStatus(id, status) {
  validateStatus(status);
  await pool.query(
    "UPDATE equipments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [status, id]
  );
  return getEquipmentById(id);
}

async function deleteEquipment(id) {
  await getEquipmentById(id);

  const [rows] = await pool.query(
    `SELECT id
     FROM rentals
     WHERE equipment_id = ?
       AND status IN (${RENTAL_REQUEST_BLOCKING_STATUSES.map(() => "?").join(", ")})
     LIMIT 1`,
    [id, ...RENTAL_REQUEST_BLOCKING_STATUSES]
  );

  if (rows.length) {
    throw createError("현재 요청 또는 대여 흐름이 남아 있는 기자재는 삭제할 수 없습니다.");
  }

  const [historyRows] = await pool.query(
    `SELECT id
     FROM rentals
     WHERE equipment_id = ?
     LIMIT 1`,
    [id]
  );

  if (historyRows.length) {
    throw createError("대여 이력이 남아 있는 기자재는 삭제할 수 없습니다. 상태 수정으로 관리해주세요.");
  }

  await pool.query("DELETE FROM equipments WHERE id = ?", [id]);
  return { success: true };
}

async function syncEquipmentQrImages() {
  const [rows] = await pool.query("SELECT id, code, qr_value, qr_image_path FROM equipments");

  for (const row of rows) {
    const qrImagePath = await ensureQrImageAsset({
      code: row.code,
      qrValue: row.qr_value,
    });

    if (row.qr_image_path !== qrImagePath) {
      await pool.query(
        "UPDATE equipments SET qr_image_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [qrImagePath, row.id]
      );
    }
  }

  return rows.length;
}

module.exports = {
  listEquipments,
  getEquipmentById,
  getEquipmentByQrValue,
  createEquipment,
  updateEquipment,
  updateEquipmentStatus,
  deleteEquipment,
  syncEquipmentQrImages,
};
