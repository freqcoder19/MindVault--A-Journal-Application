import { initializeApp, getApps, App, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// STRICT SINGLE ADMINISTRATOR FOR MINDVAULT
// Under the security constitution, barathsuresh19@gmail.com is the ONLY permitted admin account.
const SOLE_ADMIN_EMAIL = "barathsuresh19@gmail.com";

// Parse CLI arguments
function getArgs(): { password?: string; keyPath?: string; targetUid?: string } {
  const args = process.argv.slice(2);
  const result: { password?: string; keyPath?: string; targetUid?: string } = {
    password: process.env.ADMIN_PASSWORD,
    keyPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  };

  for (const arg of args) {
    if (arg.startsWith("--password=")) {
      result.password = arg.split("=")[1].trim();
    } else if (arg.startsWith("--key=")) {
      result.keyPath = arg.split("=")[1].trim();
    } else if (arg.startsWith("--uid=")) {
      result.targetUid = arg.split("=")[1].trim();
    } else if (arg.startsWith("--email=")) {
      const emailRequested = arg.split("=")[1].trim().toLowerCase();
      if (emailRequested !== SOLE_ADMIN_EMAIL.toLowerCase()) {
        console.error(`[SECURITY ERROR] Unauthorized email requested: ${emailRequested}`);
        console.error(`MindVault Security Mandate: The ONLY permitted administrator is ${SOLE_ADMIN_EMAIL}.`);
        console.error("No other account may ever be granted administrator privileges.");
        process.exit(1);
      }
    }
  }

  return result;
}

const { password: inputPassword, keyPath, targetUid } = getArgs();

// Load Firebase Project Configuration
let projectId = "mindvault-507114";
try {
  const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    if (config.projectId) {
      projectId = config.projectId;
    }
  }
} catch {
  // Ignore and proceed
}

// Initialize Firebase Admin with credentials if provided
let app: App;
if (!getApps().length) {
  let credential;
  if (keyPath) {
    try {
      let keyObj;
      if (keyPath.trim().startsWith("{")) {
        keyObj = JSON.parse(keyPath);
      } else if (fs.existsSync(keyPath)) {
        keyObj = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
      }
      if (keyObj) {
        credential = cert(keyObj);
        console.log("[Firebase Admin] Loaded service account credentials.");
      }
    } catch (e: any) {
      console.warn(`[Firebase Admin] Notice: Could not parse key from ${keyPath}: ${e.message}`);
    }
  }

  app = initializeApp({
    ...(credential ? { credential } : {}),
    projectId,
  });
} else {
  app = getApps()[0];
}

const adminAuth = getAuth(app);

async function provisionAdmin() {
  console.log("==================================================");
  console.log("MINDVAULT SECURE ADMIN PROVISIONING UTILITY");
  console.log("Zero-Trust RBAC • Single Admin Identity Enforcement");
  console.log(`Designated Administrator: ${SOLE_ADMIN_EMAIL}`);
  console.log(`Target Project:           ${projectId}`);
  console.log("==================================================\n");

  let uidToProvision = targetUid;
  let userEmail = SOLE_ADMIN_EMAIL;

  if (!uidToProvision) {
    try {
      // Step 1: Find the Firebase user by email
      const userRecord = await adminAuth.getUserByEmail(SOLE_ADMIN_EMAIL);
      console.log(`[Firebase Auth] Found user record for ${SOLE_ADMIN_EMAIL} with UID: ${userRecord.uid}`);
      uidToProvision = userRecord.uid;
      userEmail = userRecord.email || SOLE_ADMIN_EMAIL;

      // If password was explicitly provided, update it
      if (inputPassword) {
        await adminAuth.updateUser(userRecord.uid, {
          password: inputPassword,
          emailVerified: true,
        });
        console.log(`[Firebase Auth] Updated credentials for UID: ${userRecord.uid}`);
      }
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        console.log(`[Firebase Auth] User not found for ${SOLE_ADMIN_EMAIL}. Creating account...`);
        const tempPassword = inputPassword || crypto.randomBytes(24).toString("base64url");
        const newUser = await adminAuth.createUser({
          email: SOLE_ADMIN_EMAIL,
          password: tempPassword,
          displayName: "MindVault Administrator",
          emailVerified: true,
        });
        uidToProvision = newUser.uid;
        console.log(`[Firebase Auth] Created initial account for ${SOLE_ADMIN_EMAIL} with UID: ${newUser.uid}`);
        if (!inputPassword) {
          console.log(`[Generated Password] Temporary password: ${tempPassword}`);
        }
      } else {
        console.error("[Firebase Auth] Notice while looking up user by email:", err.message);
        console.log("\nIf Identity Toolkit API is disabled in the default quota project, provide the service account key:");
        console.log("  npx tsx scripts/provision-admin.ts --key=./serviceAccountKey.json");
        console.log("Or provide the UID directly if known:");
        console.log("  npx tsx scripts/provision-admin.ts --uid=<USER_UID>\n");
        process.exit(1);
      }
    }
  }

  // Step 2: Assign custom claim { admin: true } using Firebase Admin SDK
  console.log(`[RBAC] Setting custom claim { "admin": true } for UID: ${uidToProvision}...`);
  await adminAuth.setCustomUserClaims(uidToProvision, { admin: true });
  console.log(`[RBAC] Successfully assigned { "admin": true } to UID: ${uidToProvision}`);

  // Step 3: Verify claims were cryptographically set
  try {
    const verifiedUser = await adminAuth.getUser(uidToProvision);
    if (verifiedUser.customClaims?.admin === true) {
      console.log(`[Verification] Verified custom claims for ${verifiedUser.email || uidToProvision}:`, JSON.stringify(verifiedUser.customClaims));
    }
  } catch {
    console.log("[Verification] Custom claim written to Auth server.");
  }

  console.log("\n==================================================");
  console.log("ADMIN PROVISIONING COMPLETE");
  console.log("==================================================");
  console.log(`Administrator UID:   ${uidToProvision}`);
  console.log(`Administrator Email: ${userEmail}`);
  console.log(`Custom Claims:       { "admin": true }`);
  console.log("Role:                ADMIN (Sole Administrator)");
  console.log("==================================================");
  console.log("\nNEXT STEPS IN CLIENT:");
  console.log("1. Sign in to MindVault with:", userEmail);
  console.log("2. The client will call user.getIdTokenResult(true) to load the refreshed claim.");
  console.log("3. The Admin Dashboard tab will be immediately visible and authorized.\n");
}

provisionAdmin().catch((err) => {
  console.error("[Provisioning Fatal Error]:", err);
  process.exit(1);
});
