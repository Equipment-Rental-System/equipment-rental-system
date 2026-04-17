function getTimeZone() {
  return process.env.APP_TIMEZONE || "Asia/Seoul";
}

function formatDateInTimeZone(date, timeZone = getTimeZone()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function dateStringToIndex(dateString) {
  if (!dateString) {
    return null;
  }

  const [year, month, day] = String(dateString).split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

function getTodayDateString(timeZone = getTimeZone()) {
  return formatDateInTimeZone(new Date(), timeZone);
}

function diffDaysFromToday(dateString, timeZone = getTimeZone()) {
  const todayIndex = dateStringToIndex(getTodayDateString(timeZone));
  const targetIndex = dateStringToIndex(dateString);

  if (todayIndex === null || targetIndex === null) {
    return null;
  }

  return targetIndex - todayIndex;
}

module.exports = {
  getTimeZone,
  formatDateInTimeZone,
  getTodayDateString,
  dateStringToIndex,
  diffDaysFromToday,
};
