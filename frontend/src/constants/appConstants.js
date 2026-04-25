const API_BASES = [
  "http://10.0.2.2:4000/api",
  "http://127.0.0.1:4000/api",
  "http://10.0.2.2:3000/api",
  "http://127.0.0.1:3000/api",
];

const LOGIN_ROUTE_CANDIDATES = ["/auth/login", "/login"];
const EQUIPMENT_ROUTE_CANDIDATES = ["/equipments"];
const QR_SCAN_ROUTE_CANDIDATES = ["/qr-scan"];
const QR_LOOKUP_ROUTE_CANDIDATES = ["/equipments/qr/{value}"];
const CATEGORY_ROUTE_GROUPS = [
  ["/get-aduino", "/get-rsapberryPi", "/get-labtop"],
  ["/get-aduino", "/get-raspberryPi", "/get-laptop"],
];
const RENTAL_LIST_ROUTE_CANDIDATES = ["/rentals?onlyActive=true", "/rentals"];
const RENTAL_REQUEST_CANDIDATES = [
  { path: "/rentals/request", bodyType: "equipment" },
  { path: "/rentals/request", bodyType: "item" },
  { path: "/rentals", bodyType: "equipment" },
  { path: "/rentals", bodyType: "item" },
];

const QUICK_MEMOS = ["수업 실습", "프로젝트 발표", "개인 학습", "팀 과제"];

const CATEGORY_META = {
  ARDUINO: {
    image: require("../../assets/arduino.jpg"),
    badge: "키트",
    location: "학과 실습 보관함",
    components: ["Arduino 보드", "USB 케이블"],
    description: "기초 회로 실습에 사용하는 아두이노 기자재입니다.",
  },
  RASPBERRY_PI: {
    image: require("../../assets/raspberry.jpg"),
    badge: "키트",
    location: "학과 IoT 장비 보관함",
    components: ["라즈베리파이", "전원 어댑터", "HDMI 케이블"],
    description: "라즈베리파이 기반 실습에 사용하는 기자재입니다.",
  },
  LAPTOP: {
    image: require("../../assets/laptop.jpg"),
    badge: "기기",
    location: "학과 사무실 대여장",
    components: ["노트북 본체", "충전기"],
    description: "발표 및 프로젝트 실습용 공용 노트북입니다.",
  },
};

export {
  API_BASES,
  LOGIN_ROUTE_CANDIDATES,
  EQUIPMENT_ROUTE_CANDIDATES,
  QR_SCAN_ROUTE_CANDIDATES,
  QR_LOOKUP_ROUTE_CANDIDATES,
  CATEGORY_ROUTE_GROUPS,
  RENTAL_LIST_ROUTE_CANDIDATES,
  RENTAL_REQUEST_CANDIDATES,
  QUICK_MEMOS,
  CATEGORY_META,
};
