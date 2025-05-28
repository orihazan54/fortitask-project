const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const TSA_URL = 'http://freetsa.org/tsr'; // Example: FreeTSA.org

/**
 * Executes a shell command and returns a promise.
 * @param {string} command The command to execute.
 * @param {object} options Options for exec.
 * @returns {Promise<{stdout: string, stderr: string}>} Promise resolving with stdout and stderr.
 */
function execPromise(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        console.error(`Exec error for command "${command}": ${error.message}`);
        return reject(error);
      }
      if (stderr && !command.includes('ts -verify')) { // ts -verify can have stderr on success
        console.warn(`Exec stderr for command "${command}": ${stderr}`);
      }
      resolve({ stdout, stderr });
    });
  });
}

/**
 * Generates a timestamp query file from the input file.
 * @param {string} inputFilePath Path to the input file.
 * @param {string} outputTsqPath Path to save the .tsq file.
 * @returns {Promise<void>}
 */
async function createTimestampQuery(inputFilePath, outputTsqPath) {
  // Ensure the input file exists
  try {
    await fs.access(inputFilePath);
  } catch (error) {
    throw new Error(`Input file not found at ${inputFilePath}`);
  }
  // Command to create a timestamp query. SHA256 is commonly used.
  const command = `openssl ts -query -data "${inputFilePath}" -no_nonce -sha256 -cert -out "${outputTsqPath}"`;
  await execPromise(command);
  console.log(`Timestamp query file created at ${outputTsqPath}`);
}

/**
 * Sends the timestamp query file to the TSA server and saves the response.
 * @param {string} tsqFilePath Path to the .tsq file.
 * @param {string} tsrFilePath Path to save the .tsr (timestamp response) file.
 * @returns {Promise<void>}
 */
async function getTimestampResponse(tsqFilePath, tsrFilePath) {
  try {
    const tsqData = await fs.readFile(tsqFilePath);
    const response = await axios.post(TSA_URL, tsqData, {
      headers: { 'Content-Type': 'application/timestamp-query' },
      responseType: 'arraybuffer',
    });
    await fs.writeFile(tsrFilePath, response.data);
    console.log(`Timestamp response file saved at ${tsrFilePath}`);
  } catch (error) {
    console.error('Error getting timestamp response:', error.message);
    if (error.response) {
      console.error('TSA Server Response Status:', error.response.status);
      console.error('TSA Server Response Data:', Buffer.from(error.response.data).toString());
    }
    throw new Error(`Failed to get timestamp response from TSA: ${error.message}`);
  }
}

/**
 * Verifies the timestamp response and extracts the timestamp.
 * @param {string} tsqFilePath Path to the .tsq file (can also be the original data file for some checks).
 * @param {string} tsrFilePath Path to the .tsr file.
 * @param {string} originalFilePath Path to the original data file.
 * @returns {Promise<Date>}
 */
async function verifyTimestampAndExtractTime(tsqFilePath, tsrFilePath, originalFilePath) {
  // Note: For verification, some TSA providers might require the original data file or the query against the data file.
  // The command below attempts to verify the response against the query file.
  // You might need to adjust this based on the TSA provider and OpenSSL version.
  // A common CA bundle for TSA verification might be needed (e.g., from the TSA provider or a trusted source).
  // For freetsa.org, their cacert.pem and tsacert.pem might be needed.
  // For simplicity in this example, we are not using -CAfile or -untrusted yet.
  const commandVerify = `openssl ts -verify -data "${originalFilePath}" -in "${tsrFilePath}" -queryfile "${tsqFilePath}"`;
  // const commandVerify = `openssl ts -verify -digest $(openssl dgst -sha256 -binary "${originalFilePath}" | openssl base64) -in "${tsrFilePath}"`; // Alternative

  try {
    await execPromise(commandVerify);
    console.log('Timestamp response verified successfully.');
  } catch (verifyError) {
    console.error('Timestamp verification failed:', verifyError.message);
    console.error('Stderr from verification:', verifyError.stderr); 
    throw new Error(`Timestamp verification failed: ${verifyError.message}`);
  }

  // Command to print the timestamp details, including the time.
  const commandPrintTime = `openssl ts -reply -in "${tsrFilePath}" -text`;
  const { stdout } = await execPromise(commandPrintTime);
  
  // Parse the stdout to find the Time stamp line.
  // Example output: Time stamp: May 28 10:30:00 2024 GMT
  const timeStampRegex = /Time stamp: (.*)/;
  const match = stdout.match(timeStampRegex);
  
  if (match && match[1]) {
    const timeString = match[1].trim();
    // OpenSSL often includes 'GMT' or timezone info. Date.parse should handle it.
    const verifiedDate = new Date(timeString);
    if (isNaN(verifiedDate.getTime())) {
        console.error('Failed to parse date from timestamp reply:', timeString);
        throw new Error('Could not parse date from timestamp reply.');
    }
    console.log(`Verified timestamp: ${verifiedDate.toISOString()}`);
    return verifiedDate;
  } else {
    console.error('Could not extract time from TSA reply:', stdout);
    throw new Error('Could not extract time from TSA reply.');
  }
}

/**
 * Main function to get a verified timestamp for a file.
 * Cleans up temporary .tsq and .tsr files.
 * @param {string} originalFilePath Path to the original file to be timestamped.
 * @returns {Promise<Date|null>}
The verified Date object, or null if an error occurs.
 */
async function getVerifiedTimestamp(originalFilePath) {
  const baseName = path.basename(originalFilePath);
  const tsqFilePath = path.join(path.dirname(originalFilePath), `${baseName}.tsq`);
  const tsrFilePath = path.join(path.dirname(originalFilePath), `${baseName}.tsr`);

  try {
    console.log(`Starting TSA process for ${originalFilePath}`);
    await createTimestampQuery(originalFilePath, tsqFilePath);
    await getTimestampResponse(tsqFilePath, tsrFilePath);
    const verifiedDate = await verifyTimestampAndExtractTime(tsqFilePath, tsrFilePath, originalFilePath);
    return verifiedDate;
  } catch (error) {
    console.error(`TSA process failed for ${originalFilePath}: ${error.message}`);
    return null; // Or rethrow, depending on desired error handling
  } finally {
    // Clean up temporary files
    try {
      await fs.unlink(tsqFilePath);
      console.log(`Deleted temporary file: ${tsqFilePath}`);
    }
    catch (e) { /* ignore if already deleted or never created */ }
    try {
      await fs.unlink(tsrFilePath);
      console.log(`Deleted temporary file: ${tsrFilePath}`);
    }
    catch (e) { /* ignore */ }
  }
}

module.exports = { getVerifiedTimestamp }; 