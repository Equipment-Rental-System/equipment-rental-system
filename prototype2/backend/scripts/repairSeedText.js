const dotenv = require("dotenv");

dotenv.config();

const pool = require("../src/config/db");

function pad(num, size = 2) {
  return String(num).padStart(size, "0");
}

async function repairUsers() {
  const users = [
    { id: 1, name: "학과 관리자", department: "컴퓨터공학과" },
    { id: 2, name: "부관리자", department: "컴퓨터공학과" },
    { id: 3, name: "김학생", department: "컴퓨터공학과" },
    { id: 4, name: "이학생", department: "전자공학과" },
    { id: 5, name: "박대기", department: "컴퓨터공학과" },
    { id: 6, name: "최거절", department: "산업공학과" },
  ];

  for (const user of users) {
    await pool.query(
      "UPDATE users SET name = ?, department = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [user.name, user.department, user.id]
    );
  }
}

async function repairEquipments() {
  for (let i = 1; i <= 10; i += 1) {
    await pool.query(
      `UPDATE equipments
       SET name = ?, category = ?, location = ?, components = ?, description = ?, updated_at = CURRENT_TIMESTAMP
       WHERE code = ?`,
      [
        `실습용 노트북 ${pad(i)}`,
        "노트북",
        "학과 사무실 A구역",
        JSON.stringify(["노트북 본체", "충전기", "가방"]),
        "캡스톤 및 수업 대여용 노트북",
        `EQ-LAP-${pad(i, 3)}`,
      ]
    );
  }

  for (let i = 1; i <= 20; i += 1) {
    await pool.query(
      `UPDATE equipments
       SET name = ?, category = ?, location = ?, components = ?, description = ?, updated_at = CURRENT_TIMESTAMP
       WHERE code = ?`,
      [
        `Arduino Kit ${pad(i)}`,
        "아두이노",
        "실습실 기자재함 B구역",
        JSON.stringify(["Arduino Uno", "USB 케이블", "브레드보드", "점퍼선"]),
        "임베디드 실습용 아두이노 세트",
        `EQ-ARD-${pad(i, 3)}`,
      ]
    );
  }

  for (let i = 1; i <= 20; i += 1) {
    await pool.query(
      `UPDATE equipments
       SET name = ?, category = ?, location = ?, components = ?, description = ?, updated_at = CURRENT_TIMESTAMP
       WHERE code = ?`,
      [
        `Raspberry Pi Kit ${pad(i)}`,
        "라즈베리파이",
        "학과 창고 C구역",
        JSON.stringify(["Raspberry Pi 본체", "전원 어댑터", "HDMI 케이블", "SD 카드"]),
        "IoT 및 네트워크 실습용 라즈베리파이 세트",
        `EQ-RPI-${pad(i, 3)}`,
      ]
    );
  }
}

async function repairRentals() {
  const rentals = [
    { id: 1, note: "캡스톤 수업 발표 준비", adminNote: null },
    { id: 2, note: "프로젝트 개발용", adminNote: "관리자 승인 완료" },
    { id: 3, note: "연장 필요", adminNote: "연장 요청 대기" },
    { id: 4, note: "반납 요청 완료", adminNote: null },
    { id: 5, note: "아직 반납 전", adminNote: "연체 상태" },
  ];

  for (const rental of rentals) {
    await pool.query(
      "UPDATE rentals SET note = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [rental.note, rental.adminNote, rental.id]
    );
  }
}

async function repairNotifications() {
  const notifications = [
    {
      dedupeKey: "seed-approval-3",
      title: "회원 승인 완료",
      message: "관리자 승인이 완료되어 로그인할 수 있습니다.",
    },
    {
      dedupeKey: "seed-rental-request-admin1",
      title: "새 대여 요청",
      message: "김학생 사용자가 실습용 노트북 01 대여를 요청했습니다.",
    },
    {
      dedupeKey: "seed-rental-request-admin2",
      title: "새 대여 요청",
      message: "김학생 사용자가 실습용 노트북 01 대여를 요청했습니다.",
    },
    {
      dedupeKey: "seed-due-user4",
      title: "반납 3일 전 알림",
      message: "실습용 노트북 02 기자재 반납 예정일이 3일 남았습니다.",
    },
    {
      dedupeKey: "seed-overdue-admin1",
      title: "연체 기자재 발생",
      message: "김학생 사용자의 실습용 노트북 05 기자재가 연체 상태입니다.",
    },
  ];

  for (const item of notifications) {
    await pool.query(
      "UPDATE notifications SET title = ?, message = ? WHERE dedupe_key = ?",
      [item.title, item.message, item.dedupeKey]
    );
  }
}

async function run() {
  try {
    await repairUsers();
    await repairEquipments();
    await repairRentals();
    await repairNotifications();
    console.log("Seed text repair completed.");
    process.exit(0);
  } catch (error) {
    console.error("Seed text repair failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
