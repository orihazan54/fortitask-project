const { exec } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");

// כתובת שרת TSA ציבורי חינמי. ניתן להחליף אם ברשותך שרת משלך.
const TSA_URL = "http://freetsa.org/tsr";
const TEMP_DIR = "C:\\tsa_temp"; // תיקייה זמנית קבועה

function execPromise(command, options = {}) {
  return new Promise((resolve, reject) => {
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

async function createTempDir() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (e) {
    console.error("Failed to create TSA temp dir:", e.message);
    throw e;
  }
}

async function createTimestampQuery(inputFilePath, outputTsqPath) {
  await fs.access(inputFilePath);
  const command = `openssl ts -query -data "${inputFilePath}" -no_nonce -sha256 -cert -out "${outputTsqPath}"`;
  await execPromise(command);
  console.log(`\uD83D\uDCC4 TSQ created at ${outputTsqPath}`);
}

async function getTimestampResponse(tsqFilePath, tsrFilePath) {
  const tsqData = await fs.readFile(tsqFilePath);
  const response = await axios.post(TSA_URL, tsqData, {
    headers: { "Content-Type": "application/timestamp-query" },
    responseType: "arraybuffer",
  });
  await fs.writeFile(tsrFilePath, response.data);
  console.log(`\uD83D\uDCC5 TSR saved at ${tsrFilePath}`);
}

async function verifyTimestampAndExtractTime(tsqFilePath, tsrFilePath, originalFilePath) {
  // שימוש בקובץ bundle שמכיל גם Root CA וגם cacert.pem של FreeTSA
  const caBundlePath = path.join(__dirname, "tsa_certs", "tsa_bundle.pem");
  const untrustedPath = path.join(__dirname, "tsa_certs", "tsacert.pem");

  // וידוא שהקבצים קיימים
  await fs.access(caBundlePath);
  await fs.access(untrustedPath);

  const commandVerify = `openssl ts -verify -in "${tsrFilePath}" -queryfile "${tsqFilePath}" -CAfile "${caBundlePath}" -untrusted "${untrustedPath}"`;
  // const commandVerify = `openssl ts -verify -digest $(openssl dgst -sha256 -binary "${originalFilePath}" | openssl base64) -in "${tsrFilePath}"`; // Alternative

  try {
    await execPromise(commandVerify);
    console.log("\u2705 Timestamp verified successfully");

    const commandPrintTime = `openssl ts -reply -in "${tsrFilePath}" -text`;
    const { stdout } = await execPromise(commandPrintTime);

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

async function deleteIfExists(filePath) {
  try {
    await fs.unlink(filePath);
    console.log(`\uD83D\uDDD1️ Deleted: ${filePath}`);
  } catch (e) {
    // Ignore if file does not exist
  }
}

async function getVerifiedTimestamp(originalFilePath) {
  await createTempDir();

  const baseName = path.basename(originalFilePath).replace(/\s+/g, "_");
  const tsqFilePath = path.join(TEMP_DIR, `${baseName}.tsq`);
  const tsrFilePath = path.join(TEMP_DIR, `${baseName}.tsr`);

  try {
    console.log(`\uD83D\uDE80 TSA process started for ${originalFilePath}`);
    await createTimestampQuery(originalFilePath, tsqFilePath);
    await getTimestampResponse(tsqFilePath, tsrFilePath);
    const verifiedDate = await verifyTimestampAndExtractTime(tsqFilePath, tsrFilePath, originalFilePath);

    // await deleteIfExists(tsqFilePath); // Temporarily commented out
    // await deleteIfExists(tsrFilePath); // Temporarily commented out

    return verifiedDate;
  } catch (error) {
    console.error("\u274C TSA process failed:", error.message);
    return null;
  }
}

module.exports = { getVerifiedTimestamp };
