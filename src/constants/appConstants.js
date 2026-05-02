const API_BASES = [
  "http://10.0.2.2:3000/api",
  "http://127.0.0.1:3000/api",
];

const SIGNUP_ROUTE_CANDIDATES = ["/signup"];
const LOGIN_ROUTE_CANDIDATES = ["/login"];
const EQUIPMENT_ROUTE_CANDIDATES = ["/equipments"];
const QR_SCAN_ROUTE_CANDIDATES = ["/qr-scan"];
const QR_LOOKUP_ROUTE_CANDIDATES = ["/equipments/qr/{value}"];

const CATEGORY_ROUTE_GROUPS = [
  ["/get-aduino", "/get-raspberryPi", "/get-laptop"],
  ["/get-aduino", "/get-rsapberryPi", "/get-labtop"],
];

const RENTAL_LIST_ROUTE_CANDIDATES = ["/rentals?onlyActive=true", "/rentals"];
const RENTAL_REQUEST_CANDIDATES = [{ path: "/rentals", bodyType: "item" }];

const NOTIFICATION_LIST_ROUTE_CANDIDATES = ["/notification"];
const NOTIFICATION_READ_ROUTE_CANDIDATES = ["/notification/read/{id}"];

const QUICK_MEMOS = ["수업 실습", "프로젝트 발표", "개인 학습", "팀 과제"];

const CATEGORY_META = {
  ARDUINO: {
    image: require("../../assets/arduino.jpg"),
    badge: "키트",
    location: "학과 실습 보관장 A",
    components: ["Arduino 보드", "USB 케이블"],
    description: "기초 프로그래밍과 회로 실습에 사용하는 공용 아두이노 키트입니다.",
  },
  RASPBERRY_PI: {
    image: require("../../assets/raspberry.jpg"),
    badge: "키트",
    location: "학과 IoT 장비 보관장 B",
    components: ["라즈베리파이", "전원 어댑터", "HDMI 케이블"],
    description: "IoT와 리눅스 실습에 사용하는 공용 라즈베리파이 키트입니다.",
  },
  LAPTOP: {
    image: require("../../assets/laptop.jpg"),
    badge: "노트북",
    location: "학과 사무실 캐비닛",
    components: ["노트북 본체", "충전기"],
    description: "발표와 프로젝트 실습용으로 사용하는 공용 노트북입니다.",
  },
};

export {
  API_BASES,
  CATEGORY_META,
  CATEGORY_ROUTE_GROUPS,
  EQUIPMENT_ROUTE_CANDIDATES,
  LOGIN_ROUTE_CANDIDATES,
  NOTIFICATION_LIST_ROUTE_CANDIDATES,
  NOTIFICATION_READ_ROUTE_CANDIDATES,
  QR_LOOKUP_ROUTE_CANDIDATES,
  QR_SCAN_ROUTE_CANDIDATES,
  QUICK_MEMOS,
  RENTAL_LIST_ROUTE_CANDIDATES,
  RENTAL_REQUEST_CANDIDATES,
  SIGNUP_ROUTE_CANDIDATES,
};
