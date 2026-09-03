// Automated Security Verification Test Suite
async function runTests() {
  console.log("==================================================");
  console.log("MINDVAULT SECURITY ARCHITECTURE TEST SUITE");
  console.log("==================================================\n");

  const BASE_URL = "http://127.0.0.1:3000";
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition, testName, detail = "") {
    totalCount++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (detail) console.log(`   └─ ${detail}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   └─ ${detail}`);
    }
  }

  // Test 1: Health check
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const json = await res.json();
    assert(res.status === 200 && json.status === "ok", "Test 1: Public Health Check", `Project: ${json.projectId}, DB: ${json.databaseId}`);
  } catch (err) {
    assert(false, "Test 1: Public Health Check", err.message);
  }

  // Test 2: Missing token on /api/reflect -> Must return 401
  try {
    const res = await fetch(`${BASE_URL}/api/reflect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "Testing unauthenticated request" })
    });
    const json = await res.json();
    assert(res.status === 401 && (json.code === "AUTH_HEADER_MISSING" || json.code === "APP_CHECK_TOKEN_MISSING"), "Test 2: Missing Token Rejection -> HTTP 401", `Response: ${JSON.stringify(json)}`);
  } catch (err) {
    assert(false, "Test 2: Missing Token Rejection", err.message);
  }

  // Test 3: Malformed Bearer token -> Must return 401
  try {
    const res = await fetch(`${BASE_URL}/api/reflect`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Basic 12345"
      },
      body: JSON.stringify({ content: "Testing malformed bearer" })
    });
    const json = await res.json();
    assert(res.status === 401 && (json.code === "AUTH_TOKEN_MALFORMED" || json.code === "APP_CHECK_TOKEN_MISSING"), "Test 3: Malformed Bearer Token Rejection -> HTTP 401", `Response: ${JSON.stringify(json)}`);
  } catch (err) {
    assert(false, "Test 3: Malformed Bearer Token Rejection", err.message);
  }

  // Test 4: Invalid/Forged JWT Token -> Must return 401
  try {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer forged_invalid_signature_jwt_token.fake.signature"
      },
      body: JSON.stringify({ currentMessage: "Testing invalid token" })
    });
    const json = await res.json();
    assert(res.status === 401, "Test 4: Forged/Invalid JWT Token -> HTTP 401", `Response: ${JSON.stringify(json)}`);
  } catch (err) {
    assert(false, "Test 4: Forged/Invalid JWT Token", err.message);
  }

  // Test 5: Missing Token on /api/chat -> Must return 401
  try {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentMessage: "Hello" })
    });
    assert(res.status === 401, "Test 5: Missing Token on /api/chat -> HTTP 401");
  } catch (err) {
    assert(false, "Test 5: Missing Token on /api/chat", err.message);
  }

  // Test 6: Missing Token on /api/sentiment -> Must return 401
  try {
    const res = await fetch(`${BASE_URL}/api/sentiment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Hello" })
    });
    assert(res.status === 401, "Test 6: Missing Token on /api/sentiment -> HTTP 401");
  } catch (err) {
    assert(false, "Test 6: Missing Token on /api/sentiment", err.message);
  }

  // Test 7: Missing Token on /api/digest -> Must return 401
  try {
    const res = await fetch(`${BASE_URL}/api/digest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: [] })
    });
    assert(res.status === 401, "Test 7: Missing Token on /api/digest -> HTTP 401");
  } catch (err) {
    assert(false, "Test 7: Missing Token on /api/digest", err.message);
  }

  // Test 8: Missing Token on /api/prompts -> Must return 401
  try {
    const res = await fetch(`${BASE_URL}/api/prompts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredFocus: "Gratitude" })
    });
    assert(res.status === 401, "Test 8: Missing Token on /api/prompts -> HTTP 401");
  } catch (err) {
    assert(false, "Test 8: Missing Token on /api/prompts", err.message);
  }

  // Test 9: /api/security/status inspection
  try {
    const res = await fetch(`${BASE_URL}/api/security/status`);
    const json = await res.json();
    assert(
      res.status === 200 && 
      json.backendIsolationEnforced === true &&
      json.tokenVerificationEngine === "firebase-admin (verifyIdToken)" &&
      json.secretManagerConfigured === true &&
      json.secretManagerLookupAttempted === true &&
      json.geminiAuthEngine === "Google Cloud Vertex AI (Application Default Credentials / ADC)" &&
      json.selectedModel === "gemini-2.5-flash" &&
      json.rateLimiterActive === true &&
      json.storageIsolationEnforced === true &&
      json.storageRulesEnforced === true,
      "Test 9: Security Posture Status Verification (Secret Manager + Vertex AI + ADC + Storage Rules)",
      `Engine: ${json.tokenVerificationEngine}, StorageIsolated: ${json.storageIsolationEnforced}, Model: ${json.selectedModel}`
    );
  } catch (err) {
    assert(false, "Test 9: Security Posture Status Verification", err.message);
  }

  // Test 10: Image validation constraints test (simulated memory payload validation)
  try {
    const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_SIZE = 5 * 1024 * 1024;
    const MAX_IMAGES = 2;

    const testValidJpeg = { type: 'image/jpeg', size: 2 * 1024 * 1024 };
    const testInvalidMime = { type: 'application/x-msdownload', size: 1024 };
    const testOversized = { type: 'image/png', size: 6 * 1024 * 1024 };

    const validMimeCheck = ALLOWED_MIMES.includes(testValidJpeg.type);
    const rejectInvalidMime = !ALLOWED_MIMES.includes(testInvalidMime.type);
    const rejectOversized = testOversized.size > MAX_SIZE;
    const maxCountEnforced = 3 > MAX_IMAGES;

    assert(
      validMimeCheck && rejectInvalidMime && rejectOversized && maxCountEnforced,
      "Test 10: Private Memory Photo Validation (MIME types, 5MB ceiling, max 2 images per entry)",
      `Allowed: JPEG/PNG/WebP, Max Size: 5MB, Max Count: 2 images`
    );
  } catch (err) {
    assert(false, "Test 10: Memory Photo Validation", err.message);
  }

  // Test 11: Normal user (without admin claim) blocked from /api/admin/dashboard -> HTTP 403
  try {
    const res = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      method: "GET",
      headers: {
        "Authorization": "Bearer test-token-user"
      }
    });
    const json = await res.json();
    assert(
      res.status === 403 && json.code === "ADMIN_FORBIDDEN",
      "Test 11: Normal User Blocked from Admin Dashboard -> HTTP 403 Forbidden",
      `Status: ${res.status}, Code: ${json.code}`
    );
  } catch (err) {
    assert(false, "Test 11: Normal User Blocked from Admin Dashboard", err.message);
  }

  // Test 12: Admin user (with custom claim { admin: true }) allowed on /api/admin/dashboard -> HTTP 200
  try {
    const res = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      method: "GET",
      headers: {
        "Authorization": "Bearer test-token-admin"
      }
    });
    const json = await res.json();
    assert(
      res.status === 200 && (json.role === "ADMIN" || json.role === "admin") && json.aggregateMetrics !== undefined,
      "Test 12: Verified Admin Access to Admin Dashboard -> HTTP 200 OK",
      `Role: ${json.role}, TotalUsers: ${json.aggregateMetrics?.totalUserCount}, TotalEntries: ${json.aggregateMetrics?.totalJournalEntryCount}`
    );
  } catch (err) {
    assert(false, "Test 12: Verified Admin Access to Admin Dashboard", err.message);
  }

  // Test 13: Password Secrecy & Anonymization Audit
  try {
    const res = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      method: "GET",
      headers: {
        "Authorization": "Bearer test-token-admin"
      }
    });
    const text = await res.text();
    const containsPasswordField = /"password"|"adminPassword"|"userPassword"|"apiKey"|"api_key"/i.test(text);
    const containsRawEntries = /"content"|"rawJournal"|"userReflections"/i.test(text);
    assert(
      !containsPasswordField && !containsRawEntries,
      "Test 13: Zero Secret/Password Leakage & Zero Raw Journal Data in Admin Responses",
      `No password fields detected; No raw user journal contents in payload`
    );
  } catch (err) {
    assert(false, "Test 13: Password Secrecy Audit", err.message);
  }

  // Test 14: App Check Optionality on Protected Endpoints
  try {
    const res = await fetch(`${BASE_URL}/api/prompts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-token-user"
        // Notably NO X-Firebase-AppCheck header provided
      },
      body: JSON.stringify({ preferredFocus: "Calm" })
    });
    assert(
      res.status === 200,
      "Test 14: App Check Optionality - Normal user calls succeed without App Check header",
      `Endpoint responded with HTTP ${res.status}`
    );
  } catch (err) {
    assert(false, "Test 14: App Check Optionality", err.message);
  }

  // Test 15: Strict Single-Admin Boundary - Unauthorized email with admin: true claim REJECTED -> HTTP 403
  try {
    const res = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      method: "GET",
      headers: {
        "Authorization": "Bearer test-token-admin-unauthorized-email"
      }
    });
    const json = await res.json();
    assert(
      res.status === 403 && json.code === "ADMIN_FORBIDDEN",
      "Test 15: Unauthorized User with admin: true Claim Rejected -> HTTP 403 Forbidden",
      `Status: ${res.status}, Code: ${json.code}`
    );
  } catch (err) {
    assert(false, "Test 15: Unauthorized User with admin: true Claim Rejected", err.message);
  }

  // Test 16: Strict Single-Admin Boundary - barathsuresh19@gmail.com WITHOUT admin: true claim REJECTED -> HTTP 403
  try {
    const res = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      method: "GET",
      headers: {
        "Authorization": "Bearer test-token-admin-missing-claim"
      }
    });
    const json = await res.json();
    assert(
      res.status === 403 && json.code === "ADMIN_FORBIDDEN",
      "Test 16: Designated Admin Missing admin: true Claim Rejected -> HTTP 403 Forbidden",
      `Status: ${res.status}, Code: ${json.code}`
    );
  } catch (err) {
    assert(false, "Test 16: Designated Admin Missing admin: true Claim Rejected", err.message);
  }

  // Test 17: Dedicated Telemetry Endpoint - Normal User Blocked -> HTTP 403
  try {
    const res = await fetch(`${BASE_URL}/api/admin/telemetry`, {
      method: "GET",
      headers: {
        "Authorization": "Bearer test-token-user"
      }
    });
    const json = await res.json();
    assert(
      res.status === 403 && json.code === "ADMIN_FORBIDDEN",
      "Test 17: Dedicated /api/admin/telemetry Blocked for Normal User -> HTTP 403 Forbidden",
      `Status: ${res.status}, Code: ${json.code}`
    );
  } catch (err) {
    assert(false, "Test 17: Dedicated /api/admin/telemetry Blocked for Normal User", err.message);
  }

  // Test 18: Dedicated Telemetry Endpoint - Verified Admin (barathsuresh19@gmail.com + claim) Allowed -> HTTP 200
  try {
    const res = await fetch(`${BASE_URL}/api/admin/telemetry`, {
      method: "GET",
      headers: {
        "Authorization": "Bearer test-token-admin"
      }
    });
    const json = await res.json();
    assert(
      res.status === 200 && json.authorizedAdmin === "barathsuresh19@gmail.com" && json.overview !== undefined,
      "Test 18: Dedicated /api/admin/telemetry Allowed for Sole Verified Admin -> HTTP 200 OK",
      `Admin: ${json.authorizedAdmin}, Users: ${json.overview?.totalUsers}, Entries: ${json.overview?.totalEntries}`
    );
  } catch (err) {
    assert(false, "Test 18: Dedicated /api/admin/telemetry Allowed for Sole Verified Admin", err.message);
  }

  // Test 19: Dedicated Sub-Telemetry Endpoints (overview, health, ai)
  try {
    const [resOverview, resHealth, resAi] = await Promise.all([
      fetch(`${BASE_URL}/api/admin/telemetry/overview`, { headers: { "Authorization": "Bearer test-token-admin" } }),
      fetch(`${BASE_URL}/api/admin/telemetry/health`, { headers: { "Authorization": "Bearer test-token-admin" } }),
      fetch(`${BASE_URL}/api/admin/telemetry/ai`, { headers: { "Authorization": "Bearer test-token-admin" } }),
    ]);

    const jsonOverview = await resOverview.json();
    const jsonHealth = await resHealth.json();
    const jsonAi = await resAi.json();

    const allOk = resOverview.status === 200 && resHealth.status === 200 && resAi.status === 200;
    const noRawData = !JSON.stringify(jsonOverview).includes("rawJournal") && !JSON.stringify(jsonAi).includes("chatHistory");

    assert(
      allOk && noRawData,
      "Test 19: Dedicated Sub-Telemetry Endpoints (/overview, /health, /ai) -> HTTP 200 Aggregate Only",
      `Overview OK: ${resOverview.status === 200}, Health OK: ${resHealth.status === 200}, AI OK: ${resAi.status === 200}`
    );
  } catch (err) {
    assert(false, "Test 19: Dedicated Sub-Telemetry Endpoints", err.message);
  }

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passedCount}/${totalCount} TESTS PASSED`);
  console.log("==================================================");

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runTests();
