const { exec } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");

// Free public TSA server configuration for timestamp verification
// כתובת שרת TSA ציבורי חינמי. ניתן להחליף אם ברשותך שרת משלך.
const TSA_URL = "http://freetsa.org/tsr";
const TEMP_DIR = "C:\\tsa_temp"; // תיקייה זמנית קבועה

// Enhanced exec wrapper with OpenSSL environment configuration
function execPromise(command, options = {}) {
  return new Promise((resolve, reject) => {
    // Windows-specific OpenSSL environment setup for cryptographic operations
    const env = {
      ...process.env,
      OPENSSL_CONF: "C:\\Program Files\\OpenSSL-Win64\\bin\\openssl.cnf",
      PATH: `C:\\Program Files\\OpenSSL-Win64\\bin;${process.env.PATH}`
    };

    exec(command, { ...options, env, shell: true }, (error, stdout, stderr) => {
      if (error) {
        console.error(`\u274C Exec error for command "${command}": ${error.message}`);
        return reject(error);
      }
      if (stderr && !command.includes('ts -verify')) {
        console.warn(`\u26A0\uFE0F Exec stderr for command "${command}": ${stderr}`);
      }
      resolve({ stdout, stderr });
    });
  });
}

// Secure temporary directory creation for TSA operations
async function createTempDir() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (e) {
    console.error("Failed to create TSA temp dir:", e.message);
    throw e;
  }
}

// Generate RFC 3161 timestamp query for file integrity verification
async function createTimestampQuery(inputFilePath, outputTsqPath) {
  await fs.access(inputFilePath);
  // OpenSSL timestamp query generation with SHA-256 hash and certificate request
  const command = `openssl ts -query -data "${inputFilePath}" -no_nonce -sha256 -cert -out "${outputTsqPath}"`;
  await execPromise(command);
  console.log(`\uD83D\uDCC4 TSQ created at ${outputTsqPath}`);
}

// Submit timestamp query to TSA server and retrieve cryptographic response
async function getTimestampResponse(tsqFilePath, tsrFilePath) {
  const tsqData = await fs.readFile(tsqFilePath);
  // HTTP POST request to TSA with proper content type for RFC 3161 compliance
  const response = await axios.post(TSA_URL, tsqData, {
    headers: { "Content-Type": "application/timestamp-query" },
    responseType: "arraybuffer",
  });
  await fs.writeFile(tsrFilePath, response.data);
  console.log(`\uD83D\uDCC5 TSR saved at ${tsrFilePath}`);
}

// Cryptographic verification of timestamp response with certificate chain validation
async function verifyTimestampAndExtractTime(tsqFilePath, tsrFilePath, originalFilePath) {
  // Certificate authority bundle containing root CA and FreeTSA intermediate certificates
  // שימוש בקובץ bundle שמכיל גם Root CA וגם cacert.pem של FreeTSA
  const caBundlePath = path.join(__dirname, "tsa_certs", "tsa_bundle.pem");
  const untrustedPath = path.join(__dirname, "tsa_certs", "tsacert.pem");

  // Certificate file validation before cryptographic operations
  // וידוא שהקבצים קיימים
  await fs.access(caBundlePath);
  await fs.access(untrustedPath);

  // OpenSSL timestamp verification with full certificate chain validation
  const commandVerify = `openssl ts -verify -in "${tsrFilePath}" -queryfile "${tsqFilePath}" -CAfile "${caBundlePath}" -untrusted "${untrustedPath}"`;
  // const commandVerify = `openssl ts -verify -digest $(openssl dgst -sha256 -binary "${originalFilePath}" | openssl base64) -in "${tsrFilePath}"`; // Alternative

  try {
    await execPromise(commandVerify);
    console.log("\u2705 Timestamp verified successfully");

    // Extract human-readable timestamp from verified TSA response
    const commandPrintTime = `openssl ts -reply -in "${tsrFilePath}" -text`;
    const { stdout } = await execPromise(commandPrintTime);

    // Parse timestamp from TSA response using regex pattern matching
    const match = stdout.match(/Time stamp: (.*)/);
    if (match && match[1]) {
      const timeString = match[1].trim();
      const verifiedDate = new Date(timeString);
      if (isNaN(verifiedDate.getTime())) throw new Error("Invalid date");
      console.log(`\uD83D\uDCC6 Verified timestamp: ${verifiedDate.toISOString()}`);
      return verifiedDate;
    } else {
      throw new Error("\u274C Failed to extract time from response.");
    }
  } catch (error) {
    console.error("\u274C TSA process failed:", error.message);
    return null;
  }
}

// Safe file deletion utility with error suppression for cleanup operations
async function deleteIfExists(filePath) {
  try {
    await fs.unlink(filePath);
    console.log(`\uD83D\uDDD1️ Deleted: ${filePath}`);
  } catch (e) {
    // Ignore if file does not exist
  }
}

// Main TSA workflow orchestrator for file timestamp verification
async function getVerifiedTimestamp(originalFilePath) {
  await createTempDir();

  // Generate secure filenames for TSA artifacts
  const baseName = path.basename(originalFilePath).replace(/\s+/g, "_");
  const tsqFilePath = path.join(TEMP_DIR, `${baseName}.tsq`);
  const tsrFilePath = path.join(TEMP_DIR, `${baseName}.tsr`);

  try {
    console.log(`\uD83D\uDE80 TSA process started for ${originalFilePath}`);
    // Complete TSA workflow: query creation, server submission, verification
    await createTimestampQuery(originalFilePath, tsqFilePath);
    await getTimestampResponse(tsqFilePath, tsrFilePath);
    const verifiedDate = await verifyTimestampAndExtractTime(tsqFilePath, tsrFilePath, originalFilePath);

    // Cleanup temporary files (currently disabled for debugging)
    // await deleteIfExists(tsqFilePath); // Temporarily commented out
    // await deleteIfExists(tsrFilePath); // Temporarily commented out

    return verifiedDate;
  } catch (error) {
    console.error("\u274C TSA process failed:", error.message);
    return null;
  }
}

module.exports = { getVerifiedTimestamp };
