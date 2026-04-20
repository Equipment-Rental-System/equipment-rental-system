const app = require("./app");
const { syncEquipmentQrImages } = require("./services/equipmentService");
const { startNotificationScheduler } = require("./services/schedulerService");

const PORT = Number(process.env.PORT || 4000);

async function bootstrap() {
  try {
    const syncedCount = await syncEquipmentQrImages();
    console.log(`QR assets are ready for ${syncedCount} equipments.`);
  } catch (error) {
    console.error("QR asset bootstrap error:", error.message);
  }

  app.listen(PORT, () => {
    startNotificationScheduler();
    console.log(`Backend server is running on port ${PORT}`);
  });
}

bootstrap();
