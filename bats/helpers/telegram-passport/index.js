/**
 * Final Telegram Passport Generator
 *
 * This script generates valid Telegram Passport payloads for testing.
 * Features:
 * - Proper AES block alignment
 * - Optional test script generation
 * - Custom nonce support
 * - Configurable keys directory path
 */

const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

/**
 * Initializes or loads RSA keys from the specified directory
 */
function initializeKeys(keysDir) {
  // Create keys directory if needed
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
    console.log(`Created keys directory: ${keysDir}`);
  }

  const privateKeyPath = path.join(keysDir, "private.pem");
  const publicKeyPath = path.join(keysDir, "public.pem");

  // Generate RSA keys if they don't exist
  if (!fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) {
    console.log("Generating new RSA key pair...");
    const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    fs.writeFileSync(privateKeyPath, privateKey);
    fs.writeFileSync(publicKeyPath, publicKey);
    console.log(`Keys generated and saved in: ${keysDir}`);
  } else {
    console.log(`Using existing keys from: ${keysDir}`);
  }

  // Load and return the public key
  return fs.readFileSync(publicKeyPath);
}

/**
 * Fixed encryption function that ensures proper block alignment
 */
function encryptDataFixed(dataBuffer, publicKey) {
  // Generate random secret
  const secret = crypto.randomBytes(32);

  // Calculate data hash
  const dataHash = crypto.createHash("sha256").update(dataBuffer).digest();

  // AES block size is 16 bytes
  const blockSize = 16;

  // Determine padding size - ensure total length is a multiple of blockSize
  // Minimum padding is 32 bytes, with first byte being the padding length
  let paddingLength = 32; // Start with minimum
  const totalLength = paddingLength + dataBuffer.length;
  const remainder = totalLength % blockSize;

  if (remainder !== 0) {
    // Add extra padding to make total length divisible by blockSize
    paddingLength += blockSize - remainder;
  }

  // Create padding buffer
  const paddingBuffer = Buffer.alloc(paddingLength);
  paddingBuffer[0] = paddingLength; // First byte is padding length

  // Fill rest with zeros (or random bytes)
  for (let i = 1; i < paddingLength; i++) {
    paddingBuffer[i] = 0; // Using zeros for simplicity
  }

  // Combine padding and data
  const paddedData = Buffer.concat([paddingBuffer, dataBuffer]);

  // Double-check block alignment
  if (paddedData.length % blockSize !== 0) {
    throw new Error(
      `Padded data length (${paddedData.length}) is not divisible by block size (${blockSize})`,
    );
  }

  // Calculate hash of padded data - THIS is the critical part
  const paddedDataHash = crypto
    .createHash("sha256")
    .update(paddedData)
    .digest();

  // Derive key and IV from secret and padded data hash
  const combined = Buffer.concat([secret, paddedDataHash]);
  const digest = crypto.createHash("sha512").update(combined).digest();
  const key = digest.slice(0, 32);
  const iv = digest.slice(32, 48);

  // Encrypt with AES-256-CBC
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  cipher.setAutoPadding(false); // Disable auto padding as we handled it manually

  let encryptedData;
  try {
    encryptedData = Buffer.concat([cipher.update(paddedData), cipher.final()]);
  } catch (err) {
    console.error("Encryption error:", err.message);
    console.error("Padded data length:", paddedData.length);
    console.error("Data length:", dataBuffer.length);
    console.error("Padding length:", paddingLength);
    throw err;
  }

  return {
    data: encryptedData.toString("base64"),
    hash: paddedDataHash.toString("base64"),
    secret: secret.toString("base64"),
  };
}

/**
 * Encrypt credentials with the RSA public key
 */
function encryptCredentials(credentials, publicKey) {
  // Convert credentials to buffer
  const credentialsBuffer = Buffer.from(JSON.stringify(credentials));

  // Encrypt data
  const { data, hash, secret } = encryptDataFixed(credentialsBuffer, publicKey);

  // Encrypt the secret with RSA
  const secretBuffer = Buffer.from(secret, "base64");
  const encryptedSecret = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    },
    secretBuffer,
  );

  return {
    data,
    hash,
    secret: encryptedSecret.toString("base64"),
  };
}

/**
 * Create a webhook payload with encrypted credentials
 */
function createWebhookPayload(phoneNumber, nonce, publicKey) {
  // Calculate phone hash
  const phoneHash = crypto
    .createHash("sha256")
    .update(phoneNumber)
    .digest()
    .toString("base64");

  // Create credentials object
  const credentials = {
    nonce: nonce || crypto.randomBytes(16).toString("hex"),
  };

  // Encrypt credentials
  let encryptedCredentials;
  try {
    encryptedCredentials = encryptCredentials(credentials, publicKey);
  } catch (err) {
    console.error("Failed to encrypt credentials:", err.message);
    throw err;
  }

  // Create payload
  return {
    update_id: Math.floor(900000000 + Math.random() * 100000000),
    message: {
      date: Math.floor(Date.now() / 1000),
      message_id: Math.floor(1000 + Math.random() * 1000),
      from: {
        last_name: "-_-",
        language_code: "en",
        id: Math.floor(10000000 + Math.random() * 90000000),
        is_bot: false,
        first_name: "first_name",
        username: "username",
      },
      chat: {
        last_name: "-_-",
        id: Math.floor(10000000 + Math.random() * 90000000),
        type: "private",
        first_name: "first_name",
        username: "username",
      },
      passport_data: {
        data: [
          {
            type: "phone_number",
            phone_number: phoneNumber,
            hash: phoneHash,
          },
        ],
        credentials: encryptedCredentials,
      },
    },
  };
}

/**
 * Generate test script file with specified keys path
 */
function generateTestScript(keysDir) {
  const relativePath = path.relative(process.cwd(), keysDir);
  const keyPathForScript = relativePath
    ? `./${relativePath}/private.pem`
    : "./keys/private.pem";

  const testScript = `
const fs = require('fs');
// Adjust this import to match your environment
const { TelegramPassport } = require('@merqva/telegram-passport');

// Load payload and private key
const data = require('./telegram_webhook_payload.json');
const privateKey = fs.readFileSync('${keyPathForScript}');

// Create TelegramPassport instance
const telegramPassport = new TelegramPassport(privateKey);

// Try to decrypt
try {
  const decodedData = telegramPassport.decryptPassportData(
    data.message.passport_data
  );
  console.log('Successfully decrypted:');
  console.log(JSON.stringify(decodedData, null, 2));
} catch (error) {
  console.error('Decryption failed:', error.message);
}
`;

  fs.writeFileSync("test-decryption.js", testScript);
  console.log("Test script saved to test-decryption.js");
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    phoneNumber: "573001234000",
    nonce: null,
    generateTestScript: false,
    keysDir: path.join(process.cwd(), "keys"),
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--phone" && i + 1 < args.length) {
      options.phoneNumber = args[i + 1];
      i++;
    } else if (arg === "--nonce" && i + 1 < args.length) {
      options.nonce = args[i + 1];
      i++;
    } else if (arg === "--keys-dir" && i + 1 < args.length) {
      options.keysDir = args[i + 1];
      i++;
    } else if (arg === "--test-script") {
      options.generateTestScript = true;
    } else if (arg === "--help" || arg === "-h") {
      showHelp();
      process.exit(0);
    } else if (!options.phoneNumber) {
      // Legacy support for positional phone number
      options.phoneNumber = arg;
    }
  }

  return options;
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
Telegram Passport Generator

Usage:
  node ${path.basename(__filename)} [options]

Options:
  --phone <number>      Phone number to use (default: 573001234000)
  --nonce <string>      Custom nonce value (default: random generated)
  --keys-dir <path>     Directory for RSA keys (default: ./keys)
  --test-script         Generate test script (default: false)
  -h, --help            Show this help message

Examples:
  node ${path.basename(__filename)} --phone 573009876543
  node ${path.basename(__filename)} --phone 573001234000 --nonce abc123 --test-script
  node ${path.basename(__filename)} --keys-dir /path/to/my/keys
  `);
}

// Main function
function main() {
  try {
    // Parse command line arguments
    const options = parseArgs();

    // Initialize or load keys
    const publicKey = initializeKeys(options.keysDir);

    console.log(`Generating payload for phone number: ${options.phoneNumber}`);
    if (options.nonce) {
      console.log(`Using custom nonce: ${options.nonce}`);
    }

    // Create payload
    const payload = createWebhookPayload(
      options.phoneNumber,
      options.nonce,
      publicKey,
    );

    // Save to file
    const outputFile = "telegram_webhook_payload.json";
    fs.writeFileSync(outputFile, JSON.stringify(payload, null, 2));
    console.log(`Payload saved to ${outputFile}`);

    // Generate test script if requested
    if (options.generateTestScript) {
      generateTestScript(options.keysDir);
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

// Run the script
main();
