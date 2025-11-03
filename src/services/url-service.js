const crypto = require('crypto');
const AppError = require("../utils/errors/app-error");
const StatusCodes= require("http-status-codes")
const {UrlRepository}= require("../repositories")
const {logger,amountConfig}= require("../config")
const {ServerConfig}= require('../config')
const SECRET_KEY=ServerConfig.SECRET_KEY;



const urlRepository = new UrlRepository()

function encryptData(data) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    crypto.createHash("sha256").update(SECRET_KEY).digest(),
    iv
  );

  let encrypted = cipher.update(JSON.stringify(data), "utf8", "base64");
  encrypted += cipher.final("base64");


  const ivSafe = iv.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, '');
  const encryptedSafe = encrypted.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, '');
  
  return `${ivSafe}:${encryptedSafe}`;
}



function decryptData(encryptedData) {
  let [ivSafe, encryptedSafe] = encryptedData.split(":");

  if (!ivSafe || !encryptedSafe) throw new AppError("Invalid encrypted data format", 400);


  ivSafe = ivSafe.replace(/-/g, "+").replace(/_/g, "/").padEnd(ivSafe.length + (4 - ivSafe.length % 4) % 4, "=");
  encryptedSafe = encryptedSafe.replace(/-/g, "+").replace(/_/g, "/").padEnd(encryptedSafe.length + (4 - encryptedSafe.length % 4) % 4, "=");

  const iv = Buffer.from(ivSafe, "base64");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    crypto.createHash("sha256").update(SECRET_KEY).digest(),
    iv
  );

  let decrypted = decipher.update(encryptedSafe, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return JSON.parse(decrypted);
}

// Create HMAC signature
function createHmac(data) {
  return crypto.createHmac("sha256", SECRET_KEY).update(data).digest("hex");
}

// Generate secure URL
// async function generateUrl(req) {
//   const { name, email, contact, userId, domainName,ctclId,plan,brokerId , amount} = req.body;

//   if (!name || !email || !contact || !userId || !domainName || !ctclId  ||  !plan || !brokerId || !amount) {
//     throw new AppError("All fields are required", 400);
//   }

//   const payload = { name, email, contact, userId, domainName ,ctclId,plan,brokerId, amount};
//   const encryptedPayload = encodeURIComponent(encryptData(payload));
//   const signature = createHmac(encryptedPayload);

//   const frontendUrl= ServerConfig.FRONTEND_URL;
//   return `${frontendUrl}?data=${encryptedPayload}&sig=${signature}`;




// }
async function generateUrl(req) {
  const { name, email, contact, userId, domainName, ctclId, plan, brokerId, amount } = req.body;

  if (!name || !email || !contact || !userId || !domainName || !ctclId || !plan || !brokerId || !amount) {
    throw new AppError("All fields are required", 400);
  }

  const payload = { name, email, contact, userId, domainName, ctclId, plan, brokerId, amount };

  // Step 1: Encrypt payload
  const encryptedPayload = encryptData(payload);

  // Step 2: Create signature on raw (unencoded) data
  const signature = createHmac(encryptedPayload);

  // Step 3: Encode payload for safe URL transfer
  const encodedPayload = encodeURIComponent(encryptedPayload);

  // Step 4: Return full URL
  const frontendUrl = ServerConfig.FRONTEND_URL;
  return `${frontendUrl}?data=${encodedPayload}&sig=${signature}`;
}


// Decode and verify URL data
//  async function decodeUrl(data, sig) {
//  logger.info("decodeUrl service invoked", { hasData: Boolean(data), hasSig: Boolean(sig) });

//     if (!data || !sig) {
//       logger.warn("Missing data or signature in decodeUrl", { dataPresent: Boolean(data), sigPresent: Boolean(sig) });
//       throw new AppError("Missing data or signature", StatusCodes.BAD_REQUEST);
//     }
//     // const expectedSig = createHmac(data); 
//   if (expectedSig !== sig) {
//       logger.warn("Invalid signature detected in decodeUrl", { dataSnippet: data.slice(0, 50) });
//       throw new AppError("Invalid signature! Data may have been tampered with.", StatusCodes.UNAUTHORIZED);
//     }
//     const decryptedData = decryptData(decodeURIComponent(data));
//      console.log(decryptData(decodeURIComponent(data)),'popopopopopopo')
//   logger.info("decodeUrl successfully decrypted data", {  decryptedDataSnippet: JSON.stringify(decryptedData).slice(0, 100) });

//   return decryptedData;
// }

async function decodeUrl(data, sig) {
  logger.info("decodeUrl service invoked", { hasData: Boolean(data), hasSig: Boolean(sig) });

  if (!data || !sig) {
    throw new AppError("Missing data or signature", StatusCodes.BAD_REQUEST);
  }

  const decodedData = decodeURIComponent(data);  // decode first

  const expectedSig = createHmac(decodedData);
  if (expectedSig !== sig) {
    logger.warn("Invalid signature detected in decodeUrl");
    throw new AppError("Invalid signature! Data may have been tampered with.", StatusCodes.UNAUTHORIZED);
  }

  const decryptedData = decryptData(decodedData);
  logger.info("decodeUrl successfully decrypted data", {
    decryptedDataSnippet: JSON.stringify(decryptedData).slice(0, 100),
  });

  return decryptedData;
}


module.exports = {
  generateUrl,
  decodeUrl
};
