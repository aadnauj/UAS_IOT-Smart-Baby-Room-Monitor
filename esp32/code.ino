#include <WiFi.h>
#include <HTTPClient.h>
#include <LiquidCrystal_I2C.h>
#include "DHT.h"

#define WIFI_SSID "SuperDash"
#define WIFI_PASS "SuperFast"

#define API_KEY "AIzaSyDl1eKmOoJP3TVL9rcOa029Vy9njROPGXI"
#define DATABASE_URL "https://smart-plant-green-house-default-rtdb.asia-southeast1.firebasedatabase.app"
#define DATA_PATH "/iot.json"

#define EMAIL "admin1@gmail.com"
#define PASSWORD_AUTH "Admin123"

#define DHTPIN 15
#define DHTTYPE DHT11

const int ledMerah = 26;
const int ledKuning = 25;
const int ledHijau = 33;

DHT dht(DHTPIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);

String idToken;

String firebaseLogin() {
  HTTPClient http;
  String url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + String(API_KEY);
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  String payload = "{\"email\":\"" + String(EMAIL) + "\",\"password\":\"" + String(PASSWORD_AUTH) + "\",\"returnSecureToken\":true}";
  http.POST(payload);
  String response = http.getString();
  http.end();
  int start = response.indexOf("idToken\":\"") + 10;
  int end = response.indexOf("\"", start);
  return response.substring(start, end);
}

void setup() {
  Serial.begin(115200);
  pinMode(ledMerah, OUTPUT);
  pinMode(ledKuning, OUTPUT);
  pinMode(ledHijau, OUTPUT);
  dht.begin();
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Monitor Kamar");
  lcd.setCursor(0, 1);
  lcd.print("Bayi AKTIF");
  delay(2000);
  lcd.clear();
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  idToken = firebaseLogin();
}

void loop() {
  float suhu = dht.readTemperature();
  float kelembapan = dht.readHumidity();
  if (isnan(suhu) || isnan(kelembapan)) return;

  lcd.clear();
  lcd.setCursor(0, 1);
  lcd.print("S:");
  lcd.print(suhu);
  lcd.print("C ");
  lcd.print("K:");
  lcd.print(kelembapan);
  lcd.print("%");

  String kondisi;

  if (suhu > 31 || suhu < 17 || kelembapan > 70 || kelembapan < 30) {
    kondisi = "BAHAYA";
    digitalWrite(ledMerah, HIGH);
    digitalWrite(ledKuning, LOW);
    digitalWrite(ledHijau, LOW);
    lcd.setCursor(0, 0);
    lcd.print("Kondisi: BAHAYA");
  } else if ((suhu >= 18 && suhu <= 30) && (kelembapan >= 40 && kelembapan <= 60)) {
    kondisi = "NYAMAN";
    digitalWrite(ledMerah, LOW);
    digitalWrite(ledKuning, LOW);
    digitalWrite(ledHijau, HIGH);
    lcd.setCursor(0, 0);
    lcd.print("Kondisi: NYAMAN");
  } else {
    kondisi = "WASPADA";
    digitalWrite(ledMerah, LOW);
    digitalWrite(ledKuning, HIGH);
    digitalWrite(ledHijau, LOW);
    lcd.setCursor(0, 0);
    lcd.print("Kondisi: WASPADA");
  }

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(DATABASE_URL) + String(DATA_PATH) + "?auth=" + idToken;
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    String json = "{\"temperature\":" + String(suhu) + ",\"humidity\":" + String(kelembapan) + ",\"status\":\"" + kondisi + "\"}";
    http.PUT(json);
    http.end();
  }

  delay(2000);
}
