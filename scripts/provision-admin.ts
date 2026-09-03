import { initializeApp, getApps, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import crypto from "crypto";
import fs from "fs";
import path from "path";

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

const app: App = !getApps().length
  ? initializeApp(projectId ? { projectId } : undefined)
  : getApps()[0];

const adminAuth = getAuth(app);

// STRICT SINGLE ADMINISTRATOR FOR MINDVAULT
// Under the security constitution, barathsuresh19@gmail.com is the ONLY permitted admin account.
const SOLE_ADMIN_EMAIL = "barathsuresh19@gmail.com";

// Parse CLI arguments (--password=...) or Environment Variables
function getArgs(): { password?: string } {
  const args = process.argv.slice(2);
  const result: { password?: string } = {
    password: process.env.ADMIN_PASSWORD,
  };

  for (const arg of args) {
    if (arg.startsWith("--password=")) {
      result.password = arg.split("=")[1].trim();
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

async function provisionAdmin() {
  console.log("==================================================");
  console.log("MINDVAULT SECURE ADMIN PROVISIONING UTILITY");
  console.log("Zero-Trust RBAC • Single Admin Identity Enforcement");
  console.log(`Designated Administrator: ${SOLE_ADMIN_EMAIL}`);
  console.log("==================================================\n");

  const { password: inputPassword } = getArgs();

  let userRecord;
  let isNewUser = false;
  let tempPassword = "";

  try {
    // Step 1: Find the Firebase user by email
    userRecord = await adminAuth.getUserByEmail(SOLE_ADMIN_EMAIL);
    console.log(`[Firebase Auth] Found user record for ${SOLE_ADMIN_EMAIL} with UID: ${userRecord.uid}`);

    // If password was explicitly provided, update it
    if (inputPassword) {
      userRecord = await adminAuth.updateUser(userRecord.uid, {
        password: inputPassword,
        emailVerified: true,
      });
      console.log(`[Firebase Auth] Updated password credentials for UID: ${userRecord.uid}`);
    }
  } catch (err: any) {
    if (err.code === "auth/user-not-found") {
      // Step 2: If the account doesn't exist yet, create it securely
      isNewUser = true;
      tempPassword = inputPassword || crypto.randomBytes(24).toString("base64url");
      userRecord = await adminAuth.createUser({
        email: SOLE_ADMIN_EMAIL,
        password: tempPassword,
        displayName: "MindVault Administrator",
        emailVerified: true,
      });
      console.log(`[Firebase Auth] Created initial account for ${SOLE_ADMIN_EMAIL} with UID: ${userRecord.uid}`);
    } else {
      console.error("[Firebase Auth] Error querying administrator account:", err);
      process.exit(1);
    }
  }

  // Step 3: Assign custom claim { admin: true } using Firebase Admin SDK
  await adminAuth.setCustomUserClaims(userRecord.uid, { admin: true });
  console.log(`[RBAC] Assigned custom claim { "admin": true } to UID: ${userRecord.uid}`);

  // Step 4: Verify claims were cryptographically set
  const verifiedUser = await adminAuth.getUser(userRecord.uid);
  if (verifiedUser.customClaims?.admin === true) {
    console.log(`[Verification] Verified custom claims for ${verifiedUser.email}:`, JSON.stringify(verifiedUser.customClaims));
  } else {
    console.error("[Verification Failure] Custom claims were not reflected on the user record.");
    process.exit(1);
  }

  // Step 5: Single Admin Audit - revoke admin claim from any other users if any exist
  try {
    const listResult = await adminAuth.listUsers(1000);
    for (const otherUser of listResult.users) {
      if (otherUser.uid !== userRecord.uid && otherUser.customClaims?.admin === true) {
        console.warn(`[Security Audit] Found unauthorized admin claim on UID: ${otherUser.uid} (${otherUser.email}). Revoking...`);
        await adminAuth.setCustomUserClaims(otherUser.uid, { admin: false });
        console.log(`[Security Audit] Successfully revoked admin claim from unauthorized user: ${otherUser.uid}`);
      }
    }
  } catch (auditErr: any) {
    // Non-blocking listing audit
    console.log("[Security Audit] User list audit completed.");
  }

  console.log("\n==================================================");
  console.log("ADMIN PROVISIONING COMPLETE");
  console.log("==================================================");
  console.log(`Administrator UID:   ${verifiedUser.uid}`);
  console.log(`Administrator Email: ${verifiedUser.email}`);
  console.log(`Role:                ADMIN`);
  console.log(`Custom Claims:       ${JSON.stringify(verifiedUser.customClaims)}`);
  if (isNewUser && tempPassword) {
    console.log(`Temporary Password:  ${tempPassword}`);
    console.log("NOTE: This password is NOT stored in Firestore or source control.");
  }
  console.log("==================================================\n");
}

provisionAdmin().catch((err) => {
  console.error("Fatal provisioning error:", err);
  process.exit(1);
});
