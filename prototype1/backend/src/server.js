const app = require("./app");
const { startNotificationScheduler } = require("./services/schedulerService");

const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, () => {
  startNotificationScheduler();
  console.log(`Backend server is running on port ${PORT}`);
});
