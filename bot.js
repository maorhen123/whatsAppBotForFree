const qrCodeTerminal = require("qrcode-terminal");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const qrCode = require("qrcode");
const { Client, LocalAuth } = require("whatsapp-web.js");

const app = express();
const port = process.env.PORT || 3000;

let lastQr = "";
let isQrLocked = false;
let client;
let isInitialized = false;

// הפעלת לקוח וואטסאפ פעם אחת בלבד
function getWhatsAppClient() {
  if (!client && !isInitialized) {
    client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    isInitialized = true;

    // אירוע: יצירת QR
    client.on("qr", (qr) => {
      if (!isQrLocked) {
        lastQr = qr;
        isQrLocked = true;
        qrCodeTerminal.generate(qr, { small: true });
        console.log("🔄 קיבלתי QR חדש וננעל");
      } else {
        console.log("⛔ QR כבר קיים - לא נוצר חדש");
      }
    });

    // אירוע: מוכן
    client.on("ready", () => {
      console.log("✅ WhatsApp client is ready!");
    });

    // אירוע: הודעות
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
        );
      } else if (msg.body === "1") {
        await client.sendMessage(msg.from, `כאן אני בודק עם 1 עובד יאללה מגניב אם קיבלת נראה שעובד`);
      } else if (msg.body === "2") {
        await client.sendMessage(msg.from, `כאן אני בודק עם 2 עובד יאללה מגניב אם קיבלת נראה שעובד`);
      } else {
        await client.sendMessage(msg.from,
          `👋 שלום! כדי להתחיל, שלח את המילה *התחל*.
אם כבר התחלת, בחר מהכפתורים שהופיעו לך.`
        );
      }
    });

    client.initialize();
  }

  return client;
}

// הפעלת הלקוח
getWhatsAppClient();

// הגדרות Express
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// API להחזרת QR
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
