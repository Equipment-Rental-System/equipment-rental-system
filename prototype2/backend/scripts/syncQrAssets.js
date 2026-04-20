const dotenv = require("dotenv");

dotenv.config();

const pool = require("../src/config/db");
const { syncEquipmentQrImages } = require("../src/services/equipmentService");

async function run() {
  try {
    const count = await syncEquipmentQrImages();
    console.log(`QR asset sync completed for ${count} equipment records.`);
    process.exit(0);
  } catch (error) {
    console.error("QR asset sync failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
