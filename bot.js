const qrCodeTerminal = require("qrcode-terminal");
const puppeteer = require("puppeteer");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const qrCode = require("qrcode");
const { Client } = require("whatsapp-web.js");

const app = express();
const port = process.env.PORT || 3000;

// הגדרת לקוח וואטסאפ
const client = new Client({
  webVersionCache: {
    puppeteer: { headless: true },
    qrRefreshIntervalMs: false,
    qrTimeoutMs: 0,
    type: "remote",
    remotePath:
      "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
  },
});

let qrImageUrl = "";

// יצירת QR בקונסול
client.on("qr", (qr) => {
  qrCodeTerminal.generate(qr, { small: true });
});

// התחברות בוט מוכנה
client.on("ready", () => {
  console.log("✅ WhatsApp client is ready!");
});

// קבלת הודעות עם כפתורים
client.on("message", async (msg) => {
  if (msg.from.includes("-")) {
    console.log("📢 הודעה מקבוצה – לא מטופלת");
    return;
  }

  if (msg.body === "התחל") {
      await client.sendMessage(msg.from, 
         `שלום וברוכים הבאים לבוט הבדיקה 🤖

כאן תוכלו לבדוק תגובות שונות לפי בחירתכם.

*1* - בדיקה 1  
*2* - בדיקה 2`
      )
  }

  if (msg.body === "1") {
    await client.sendMessage(
      msg.from,
      `כאן אני בודק עם 1 עובד יאללה מגניב אם קיבלת נראה שעובד`
    );
  } else if (msg.body === "2") {
    await client.sendMessage(
      msg.from,
      `כאן אני בודק עם 2 עובד יאללה מגניב אם קיבלת נראה שעובד`
    );
  } else if (msg.body !== "התחל") {
    await client.sendMessage(
      msg.from,
      `👋 שלום! כדי להתחיל, שלח את המילה *התחל*.
אם כבר התחלת, בחר מהכפתורים שהופיעו לך.`
    );
  }
});

client.initialize();

// הגדרות Express
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));


let lastQr = "";

client.on("qr", (qr) => {
  lastQr = qr;
  qrCodeTerminal.generate(qr, { small: true });
  console.log("🔄 קיבלתי QR חדש!");
});

// route להפקת QR דרך API
app.get("/qr-code", async (req, res) => {
  if (!lastQr) {
    return res.json({
      status: "waiting",
      message: "הקוד עדיין לא מוכן, נסה שוב בעוד רגע.",
    });
  }

  qrCode.toDataURL(lastQr, (err, url) => {
    if (err) {
      console.error("⚠️ Failed to generate QR:", err);
      return res.status(500).json({ status: "error", message: "Failed to generate QR" });
    }

    res.json({ status: "success", qr: url });
  });
});



// הפעלת השרת
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
