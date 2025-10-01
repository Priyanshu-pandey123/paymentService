const crypto = require('crypto');
const AppError= require("../utils/errors/app-error")


const SECRET_KEY = "your_super_secret_key";

// Encrypt data
function encryptData(data) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    crypto.createHash("sha256").update(SECRET_KEY).digest(),
    iv
  );
  let encrypted = cipher.update(JSON.stringify(data), "utf8", "base64");
  encrypted += cipher.final("base64");
  return iv.toString("base64") + ":" + encrypted;
}

// Decrypt data
function decryptData(encryptedData) {
  const [ivBase64, data] = encryptedData.split(":");
  const iv = Buffer.from(ivBase64, "base64");

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    crypto.createHash("sha256").update(SECRET_KEY).digest(),
    iv
  );

  let decrypted = decipher.update(data, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return JSON.parse(decrypted);
}

// Create HMAC signature
function createHmac(data) {
  return crypto.createHmac("sha256", SECRET_KEY).update(data).digest("hex");
}

// Generate a secure URL
async function generateUrl(req) {
  const { name, email, contact, userId, domainName } = req.body;

  if (!name || !email || !contact || !userId || !domainName) {
    throw new Error("All fields are required");
  }

  const payload = { name, email, contact, userId, domainName };
  const encryptedPayload = encodeURIComponent(encryptData(payload));
  const signature = createHmac(encryptedPayload);

  const frontendUrl = "https://372w16mm-5173.inc1.devtunnels.ms/";
  return `${frontendUrl}?data=${encryptedPayload}&sig=${signature}`;
}

// Decode and verify URL data
function decodeUrl(data, sig) {
  const expectedSig = createHmac(data);
   if (!data || !sig) throw new AppError("Missing data or signature", 400);

  return decryptData(decodeURIComponent(data));
}

module.exports = {
  generateUrl,
  decodeUrl
};
