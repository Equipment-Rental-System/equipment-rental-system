const pool = require("../config/db");
const notificationService = require("./notificationService");
const {
  USER_ROLES,
  EQUIPMENT_STATUS,
  RENTAL_STATUS,
  ACTIVE_RENTAL_STATUSES,
  RENTAL_REQUEST_BLOCKING_STATUSES,
  RETURN_REQUESTABLE_RENTAL_STATUSES,
  EXTENSION_REQUESTABLE_RENTAL_STATUSES,
} = require("../utils/constants");
const { diffDaysFromToday, getTodayDateString } = require("../utils/dates");

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function mapRental(row) {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    studentId: row.student_id,
    equipmentId: row.equipment_id,
    equipmentName: row.equipment_name,
    equipmentCode: row.equipment_code,
    equipmentStatus: row.equipment_status,
    requestDate: row.request_date,
    approvalDate: row.approval_date,
    rentDate: row.rent_date,
    dueDate: row.due_date,
    requestedDueDate: row.requested_due_date,
    extensionRequestDate: row.extension_request_date,
    extensionApprovalDate: row.extension_approval_date,
    returnRequestDate: row.return_request_date,
    returnApprovedDate: row.return_approved_date,
    status: row.status,
    note: row.note,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getRentalRow(connection, rentalId) {
  const [rows] = await connection.query(
    `SELECT r.*,
            u.name AS user_name,
            u.student_id,
            e.name AS equipment_name,
            e.code AS equipment_code,
            e.status AS equipment_status
     FROM rentals r
     INNER JOIN users u ON u.id = r.user_id
     INNER JOIN equipments e ON e.id = r.equipment_id
     WHERE r.id = ?`,
    [rentalId]
  );

  if (!rows.length) {
    throw createError("대여 요청 또는 대여 기록을 찾을 수 없습니다.", 404);
  }

  return rows[0];
}

async function insertAdminAction(connection, payload) {
  await connection.query(
    `INSERT INTO admin_action_logs (admin_id, rental_id, equipment_id, action, note)
     VALUES (?, ?, ?, ?, ?)`,
    [payload.adminId, payload.rentalId, payload.equipmentId, payload.action, payload.note || ""]
  );
}

async function listRentals(user, query = {}) {
  const params = [];
  const conditions = [];

  if (user.role !== USER_ROLES.ADMIN) {
    conditions.push("r.user_id = ?");
    params.push(user.id);
  }

  if (query.status) {
    conditions.push("r.status = ?");
    params.push(query.status);
  }

  if (query.onlyActive === "true") {
    conditions.push(`r.status IN (${ACTIVE_RENTAL_STATUSES.map(() => "?").join(", ")})`);
    params.push(...ACTIVE_RENTAL_STATUSES);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `SELECT r.*,
            u.name AS user_name,
            u.student_id,
            e.name AS equipment_name,
            e.code AS equipment_code,
            e.status AS equipment_status
     FROM rentals r
     INNER JOIN users u ON u.id = r.user_id
     INNER JOIN equipments e ON e.id = r.equipment_id
     ${whereClause}
     ORDER BY r.created_at DESC, r.id DESC`,
    params
  );

  return rows.map(mapRental);
}

async function listPendingRentalRequests() {
  const [rows] = await pool.query(
    `SELECT r.*,
            u.name AS user_name,
            u.student_id,
            e.name AS equipment_name,
            e.code AS equipment_code,
            e.status AS equipment_status
     FROM rentals r
     INNER JOIN users u ON u.id = r.user_id
     INNER JOIN equipments e ON e.id = r.equipment_id
     WHERE r.status = ?
     ORDER BY r.request_date ASC, r.id ASC`,
    [RENTAL_STATUS.REQUESTED]
  );

  return rows.map(mapRental);
}

async function listReturnPending() {
  const [rows] = await pool.query(
    `SELECT r.*,
            u.name AS user_name,
            u.student_id,
            e.name AS equipment_name,
            e.code AS equipment_code,
            e.status AS equipment_status
     FROM rentals r
     INNER JOIN users u ON u.id = r.user_id
     INNER JOIN equipments e ON e.id = r.equipment_id
     WHERE r.status = ?
     ORDER BY r.return_request_date ASC, r.id ASC`,
    [RENTAL_STATUS.RETURN_PENDING]
  );

  return rows.map(mapRental);
}

async function listOverdueRentals() {
  const [rows] = await pool.query(
    `SELECT r.*,
            u.name AS user_name,
            u.student_id,
            e.name AS equipment_name,
            e.code AS equipment_code,
            e.status AS equipment_status
     FROM rentals r
     INNER JOIN users u ON u.id = r.user_id
     INNER JOIN equipments e ON e.id = r.equipment_id
     WHERE r.status = ?
     ORDER BY r.due_date ASC, r.id ASC`,
    [RENTAL_STATUS.OVERDUE]
  );

  return rows.map(mapRental);
}

async function requestRental({ userId, equipmentId, dueDate, note }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [equipmentRows] = await connection.query(
      "SELECT * FROM equipments WHERE id = ? FOR UPDATE",
      [equipmentId]
    );

    if (!equipmentRows.length) {
      throw createError("대여 요청할 기자재를 찾을 수 없습니다.", 404);
    }

    const equipment = equipmentRows[0];

    if (equipment.status !== EQUIPMENT_STATUS.AVAILABLE) {
      throw createError("현재 대여 요청이 불가능한 기자재입니다.");
    }

    const [blockingRows] = await connection.query(
      `SELECT id
       FROM rentals
       WHERE equipment_id = ?
         AND status IN (${RENTAL_REQUEST_BLOCKING_STATUSES.map(() => "?").join(", ")})
       LIMIT 1`,
      [equipmentId, ...RENTAL_REQUEST_BLOCKING_STATUSES]
    );

    if (blockingRows.length) {
      throw createError("이미 다른 요청 또는 대여가 진행 중인 기자재입니다.");
    }

    const [result] = await connection.query(
      `INSERT INTO rentals
        (user_id, equipment_id, request_date, due_date, status, note)
       VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, ?)`,
      [userId, equipmentId, dueDate || null, RENTAL_STATUS.REQUESTED, note || ""]
    );

    await connection.query(
      "UPDATE equipments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [EQUIPMENT_STATUS.RENTAL_PENDING, equipmentId]
    );

    await connection.commit();

    const rental = mapRental(await getRentalRow(pool, result.insertId));

    await notificationService.createAdminNotifications({
      rentalId: rental.id,
      type: "RENTAL_REQUEST",
      title: "새 대여 요청",
      message: `${rental.userName} 사용자가 ${rental.equipmentName} 대여를 요청했습니다.`,
      dedupeKeyBase: `rental-request:${rental.id}`,
    });

    return rental;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function approveRental({ rentalId, adminId, adminNote }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const rental = await getRentalRow(connection, rentalId);

    if (rental.status !== RENTAL_STATUS.REQUESTED) {
      throw createError("승인 대기 중인 대여 요청만 승인할 수 있습니다.");
    }

    await connection.query(
      `UPDATE rentals
       SET status = ?, approval_date = CURRENT_TIMESTAMP, rent_date = CURRENT_TIMESTAMP,
           admin_note = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [RENTAL_STATUS.APPROVED, adminNote || "", rentalId]
    );

    await connection.query(
      "UPDATE equipments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [EQUIPMENT_STATUS.RENTED, rental.equipment_id]
    );

    await insertAdminAction(connection, {
      adminId,
      rentalId,
      equipmentId: rental.equipment_id,
      action: "APPROVE_RENTAL",
      note: adminNote || "대여 요청 승인",
    });

    await connection.commit();

    const updatedRental = mapRental(await getRentalRow(pool, rentalId));

    await notificationService.createUserNotification(updatedRental.userId, {
      rentalId,
      type: "RENTAL_APPROVED",
      title: "대여 요청 승인",
      message: `${updatedRental.equipmentName} 대여 요청이 승인되었습니다.`,
      dedupeKeyBase: `rental-approved:${rentalId}`,
    });

    return updatedRental;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function rejectRental({ rentalId, adminId, adminNote }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const rental = await getRentalRow(connection, rentalId);

    if (rental.status !== RENTAL_STATUS.REQUESTED) {
      throw createError("승인 대기 중인 대여 요청만 거절할 수 있습니다.");
    }

    await connection.query(
      `UPDATE rentals
       SET status = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [RENTAL_STATUS.REJECTED, adminNote || "", rentalId]
    );

    await connection.query(
      "UPDATE equipments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [EQUIPMENT_STATUS.AVAILABLE, rental.equipment_id]
    );

    await insertAdminAction(connection, {
      adminId,
      rentalId,
      equipmentId: rental.equipment_id,
      action: "REJECT_RENTAL",
      note: adminNote || "대여 요청 거절",
    });

    await connection.commit();

    const updatedRental = mapRental(await getRentalRow(pool, rentalId));

    await notificationService.createUserNotification(updatedRental.userId, {
      rentalId,
      type: "RENTAL_REJECTED",
      title: "대여 요청 거절",
      message: `${updatedRental.equipmentName} 대여 요청이 거절되었습니다.`,
      dedupeKeyBase: `rental-rejected:${rentalId}`,
    });

    return updatedRental;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function requestExtension({ rentalId, user, requestedDueDate, note }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const rental = await getRentalRow(connection, rentalId);

    if (user.role !== USER_ROLES.ADMIN && rental.user_id !== user.id) {
      throw createError("본인의 대여 건만 연장 요청할 수 있습니다.", 403);
    }

    if (!EXTENSION_REQUESTABLE_RENTAL_STATUSES.includes(rental.status)) {
      throw createError("현재 연장 요청이 가능한 상태가 아닙니다.");
    }

    if (!requestedDueDate) {
      throw createError("희망 반납일을 입력해주세요.");
    }

    if (rental.status === RENTAL_STATUS.EXTENSION_REQUESTED) {
      throw createError("이미 연장 요청이 접수된 상태입니다.");
    }

    const currentDueIndex = rental.due_date ? Date.parse(rental.due_date) : null;
    const requestedDueIndex = Date.parse(requestedDueDate);

    if (currentDueIndex !== null && requestedDueIndex <= currentDueIndex) {
      throw createError("희망 반납일은 현재 반납 예정일보다 뒤여야 합니다.");
    }

    await connection.query(
      `UPDATE rentals
       SET requested_due_date = ?, extension_request_date = CURRENT_TIMESTAMP,
           status = ?, note = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [requestedDueDate, RENTAL_STATUS.EXTENSION_REQUESTED, note || rental.note || "", rentalId]
    );

    await connection.commit();

    const updatedRental = mapRental(await getRentalRow(pool, rentalId));

    await notificationService.createAdminNotifications({
      rentalId,
      type: "EXTENSION_REQUEST",
      title: "연장 요청 접수",
      message: `${updatedRental.userName} 사용자가 ${updatedRental.equipmentName} 연장을 요청했습니다.`,
      dedupeKeyBase: `extension-request:${rentalId}:${requestedDueDate}`,
    });

    return updatedRental;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function approveExtension({ rentalId, adminId, adminNote }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const rental = await getRentalRow(connection, rentalId);

    if (rental.status !== RENTAL_STATUS.EXTENSION_REQUESTED) {
      throw createError("연장 요청 상태의 대여 건만 승인할 수 있습니다.");
    }

    if (!rental.requested_due_date) {
      throw createError("승인할 희망 반납일 정보가 없습니다.");
    }

    await connection.query(
      `UPDATE rentals
       SET due_date = requested_due_date,
           extension_approval_date = CURRENT_TIMESTAMP,
           status = ?,
           admin_note = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [RENTAL_STATUS.EXTENSION_APPROVED, adminNote || "", rentalId]
    );

    await connection.query(
      "UPDATE equipments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [EQUIPMENT_STATUS.RENTED, rental.equipment_id]
    );

    await insertAdminAction(connection, {
      adminId,
      rentalId,
      equipmentId: rental.equipment_id,
      action: "APPROVE_EXTENSION",
      note: adminNote || "연장 요청 승인",
    });

    await connection.commit();

    const updatedRental = mapRental(await getRentalRow(pool, rentalId));

    await notificationService.createUserNotification(updatedRental.userId, {
      rentalId,
      type: "EXTENSION_APPROVED",
      title: "연장 요청 승인",
      message: `${updatedRental.equipmentName} 반납 예정일이 ${updatedRental.dueDate}로 연장되었습니다.`,
      dedupeKeyBase: `extension-approved:${rentalId}:${updatedRental.dueDate}`,
    });

    return updatedRental;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function rejectExtension({ rentalId, adminId, adminNote }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const rental = await getRentalRow(connection, rentalId);

    if (rental.status !== RENTAL_STATUS.EXTENSION_REQUESTED) {
      throw createError("연장 요청 상태의 대여 건만 거절할 수 있습니다.");
    }

    const nextEquipmentStatus =
      rental.due_date && diffDaysFromToday(rental.due_date) < 0
        ? EQUIPMENT_STATUS.OVERDUE
        : EQUIPMENT_STATUS.RENTED;

    const nextRentalStatus =
      nextEquipmentStatus === EQUIPMENT_STATUS.OVERDUE
        ? RENTAL_STATUS.OVERDUE
        : RENTAL_STATUS.EXTENSION_REJECTED;

    await connection.query(
      `UPDATE rentals
       SET status = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nextRentalStatus, adminNote || "", rentalId]
    );

    await connection.query(
      "UPDATE equipments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [nextEquipmentStatus, rental.equipment_id]
    );

    await insertAdminAction(connection, {
      adminId,
      rentalId,
      equipmentId: rental.equipment_id,
      action: "REJECT_EXTENSION",
      note: adminNote || "연장 요청 거절",
    });

    await connection.commit();

    const updatedRental = mapRental(await getRentalRow(pool, rentalId));

    await notificationService.createUserNotification(updatedRental.userId, {
      rentalId,
      type: "EXTENSION_REJECTED",
      title: "연장 요청 거절",
      message: `${updatedRental.equipmentName} 연장 요청이 거절되었습니다.`,
      dedupeKeyBase: `extension-rejected:${rentalId}`,
    });

    return updatedRental;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function requestReturn({ rentalId, user }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const rental = await getRentalRow(connection, rentalId);

    if (user.role !== USER_ROLES.ADMIN && rental.user_id !== user.id) {
      throw createError("본인의 대여 건만 반납 요청할 수 있습니다.", 403);
    }

    if (!RETURN_REQUESTABLE_RENTAL_STATUSES.includes(rental.status)) {
      throw createError("현재 반납 요청이 가능한 상태가 아닙니다.");
    }

    await connection.query(
      `UPDATE rentals
       SET status = ?, return_request_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [RENTAL_STATUS.RETURN_PENDING, rentalId]
    );

    await connection.query(
      "UPDATE equipments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [EQUIPMENT_STATUS.RETURN_PENDING, rental.equipment_id]
    );

    await connection.commit();

    const updatedRental = mapRental(await getRentalRow(pool, rentalId));

    await notificationService.createAdminNotifications({
      rentalId,
      type: "RETURN_REQUESTED",
      title: "반납 요청 접수",
      message: `${updatedRental.userName} 사용자가 ${updatedRental.equipmentName} 반납을 요청했습니다.`,
      dedupeKeyBase: `return-request:${rentalId}`,
    });

    return updatedRental;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function approveReturn({ rentalId, adminId, adminNote }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const rental = await getRentalRow(connection, rentalId);

    if (rental.status !== RENTAL_STATUS.RETURN_PENDING) {
      throw createError("반납 대기 상태의 대여 건만 반납 승인할 수 있습니다.");
    }

    await connection.query(
      `UPDATE rentals
       SET status = ?, return_approved_date = CURRENT_TIMESTAMP,
           admin_note = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [RENTAL_STATUS.RETURNED, adminNote || "", rentalId]
    );

    await connection.query(
      "UPDATE equipments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [EQUIPMENT_STATUS.AVAILABLE, rental.equipment_id]
    );

    await insertAdminAction(connection, {
      adminId,
      rentalId,
      equipmentId: rental.equipment_id,
      action: "APPROVE_RETURN",
      note: adminNote || "실물 확인 후 정상 반납 승인",
    });

    await connection.query(
      `INSERT INTO inspection_logs (rental_id, equipment_id, admin_id, action, note)
       VALUES (?, ?, ?, ?, ?)`,
      [rentalId, rental.equipment_id, adminId, "APPROVE_RETURN", adminNote || "정상 반납"]
    );

    await connection.commit();

    const updatedRental = mapRental(await getRentalRow(pool, rentalId));

    await notificationService.createUserNotification(updatedRental.userId, {
      rentalId,
      type: "RETURN_APPROVED",
      title: "반납 승인 완료",
      message: `${updatedRental.equipmentName} 반납이 최종 승인되었습니다.`,
      dedupeKeyBase: `return-approved:${rentalId}`,
    });

    return updatedRental;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function markInspection({ rentalId, adminId, adminNote }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const rental = await getRentalRow(connection, rentalId);

    if (rental.status !== RENTAL_STATUS.RETURN_PENDING) {
      throw createError("반납 대기 상태에서만 점검 필요 처리가 가능합니다.");
    }

    await connection.query(
      `UPDATE rentals
       SET status = ?, return_approved_date = CURRENT_TIMESTAMP,
           admin_note = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [RENTAL_STATUS.RETURNED, adminNote || "", rentalId]
    );

    await connection.query(
      "UPDATE equipments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [EQUIPMENT_STATUS.INSPECTION_REQUIRED, rental.equipment_id]
    );

    await insertAdminAction(connection, {
      adminId,
      rentalId,
      equipmentId: rental.equipment_id,
      action: "MARK_INSPECTION_REQUIRED",
      note: adminNote || "점검 필요",
    });

    await connection.query(
      `INSERT INTO inspection_logs (rental_id, equipment_id, admin_id, action, note)
       VALUES (?, ?, ?, ?, ?)`,
      [rentalId, rental.equipment_id, adminId, "MARK_INSPECTION_REQUIRED", adminNote || "점검 필요"]
    );

    await connection.commit();

    const updatedRental = mapRental(await getRentalRow(pool, rentalId));

    await notificationService.createUserNotification(updatedRental.userId, {
      rentalId,
      type: "RETURN_INSPECTION",
      title: "반납 후 점검 필요",
      message: `${updatedRental.equipmentName} 반납 결과 점검 필요 상태로 처리되었습니다.`,
      dedupeKeyBase: `return-inspection:${rentalId}`,
    });

    return updatedRental;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function markRepair({ rentalId, adminId, adminNote }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const rental = await getRentalRow(connection, rentalId);

    if (rental.status !== RENTAL_STATUS.RETURN_PENDING) {
      throw createError("반납 대기 상태에서만 수리 처리할 수 있습니다.");
    }

    await connection.query(
      `UPDATE rentals
       SET status = ?, return_approved_date = CURRENT_TIMESTAMP,
           admin_note = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [RENTAL_STATUS.RETURNED, adminNote || "", rentalId]
    );

    await connection.query(
      "UPDATE equipments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [EQUIPMENT_STATUS.REPAIR, rental.equipment_id]
    );

    await insertAdminAction(connection, {
      adminId,
      rentalId,
      equipmentId: rental.equipment_id,
      action: "MARK_REPAIR",
      note: adminNote || "수리 필요",
    });

    await connection.query(
      `INSERT INTO inspection_logs (rental_id, equipment_id, admin_id, action, note)
       VALUES (?, ?, ?, ?, ?)`,
      [rentalId, rental.equipment_id, adminId, "MARK_REPAIR", adminNote || "수리 필요"]
    );

    await connection.commit();

    const updatedRental = mapRental(await getRentalRow(pool, rentalId));

    await notificationService.createUserNotification(updatedRental.userId, {
      rentalId,
      type: "RETURN_REPAIR",
      title: "수리 처리",
      message: `${updatedRental.equipmentName} 반납 결과 수리 필요 상태로 처리되었습니다.`,
      dedupeKeyBase: `return-repair:${rentalId}`,
    });

    return updatedRental;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function processDueNotifications() {
  const [rows] = await pool.query(
    `SELECT r.*,
            u.name AS user_name,
            u.student_id,
            e.name AS equipment_name,
            e.code AS equipment_code,
            e.status AS equipment_status
     FROM rentals r
     INNER JOIN users u ON u.id = r.user_id
     INNER JOIN equipments e ON e.id = r.equipment_id
     WHERE r.status IN (?, ?, ?, ?)`,
    [
      RENTAL_STATUS.APPROVED,
      RENTAL_STATUS.EXTENSION_APPROVED,
      RENTAL_STATUS.EXTENSION_REJECTED,
      RENTAL_STATUS.OVERDUE,
    ]
  );

  for (const row of rows) {
    const rental = mapRental(row);
    const dayDiff = diffDaysFromToday(rental.dueDate);
    const today = getTodayDateString();

    if (dayDiff === null) {
      continue;
    }

    if (dayDiff < 0) {
      if (rental.status !== RENTAL_STATUS.OVERDUE || rental.equipmentStatus !== EQUIPMENT_STATUS.OVERDUE) {
        await pool.query(
          "UPDATE rentals SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [RENTAL_STATUS.OVERDUE, rental.id]
        );
        await pool.query(
          "UPDATE equipments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [EQUIPMENT_STATUS.OVERDUE, rental.equipmentId]
        );
      }

      await notificationService.createUserNotification(rental.userId, {
        rentalId: rental.id,
        type: "OVERDUE",
        title: "연체 발생",
        message: `${rental.equipmentName} 기자재가 반납 예정일을 지나 연체 상태입니다.`,
        dedupeKeyBase: `overdue:${rental.id}:${rental.dueDate}`,
      });

      await notificationService.createAdminNotifications({
        rentalId: rental.id,
        type: "OVERDUE",
        title: "연체 기자재 발생",
        message: `${rental.userName} 사용자의 ${rental.equipmentName} 기자재가 연체 상태입니다.`,
        dedupeKeyBase: `admin-overdue:${rental.id}:${rental.dueDate}`,
      });

      continue;
    }

    const dueNotificationMap = {
      3: {
        type: "DUE_3_DAYS",
        title: "반납 3일 전 알림",
        userMessage: `${rental.equipmentName} 기자재 반납 예정일이 3일 남았습니다.`,
        adminMessage: `${rental.userName} 사용자의 ${rental.equipmentName} 기자재 반납일이 3일 남았습니다.`,
      },
      1: {
        type: "DUE_1_DAY",
        title: "반납 1일 전 알림",
        userMessage: `${rental.equipmentName} 기자재 반납 예정일이 하루 남았습니다.`,
        adminMessage: `${rental.userName} 사용자의 ${rental.equipmentName} 기자재 반납일이 하루 남았습니다.`,
      },
      0: {
        type: "DUE_TODAY",
        title: "반납일 당일 알림",
        userMessage: `${rental.equipmentName} 기자재 반납일이 오늘입니다.`,
        adminMessage: `${rental.userName} 사용자의 ${rental.equipmentName} 기자재 반납일이 오늘입니다.`,
      },
    };

    const dueNotification = dueNotificationMap[dayDiff];

    if (!dueNotification) {
      continue;
    }

    await notificationService.createUserNotification(rental.userId, {
      rentalId: rental.id,
      type: dueNotification.type,
      title: dueNotification.title,
      message: dueNotification.userMessage,
      dedupeKeyBase: `due:${rental.id}:${dueNotification.type}:${today}`,
    });

    await notificationService.createAdminNotifications({
      rentalId: rental.id,
      type: dueNotification.type,
      title: dueNotification.title,
      message: dueNotification.adminMessage,
      dedupeKeyBase: `admin-due:${rental.id}:${dueNotification.type}:${today}`,
    });
  }
}

module.exports = {
  listRentals,
  listPendingRentalRequests,
  listReturnPending,
  listOverdueRentals,
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
  processDueNotifications,
};
