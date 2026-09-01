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
    assert(res.status === 401 && json.code === "AUTH_HEADER_MISSING", "Test 2: Missing Token Rejection -> HTTP 401", `Response: ${JSON.stringify(json)}`);
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
    assert(res.status === 401 && json.code === "AUTH_TOKEN_MALFORMED", "Test 3: Malformed Bearer Token Rejection -> HTTP 401", `Response: ${JSON.stringify(json)}`);
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
      json.rateLimiterActive === true,
      "Test 9: Security Posture Status Verification (Secret Manager + Vertex AI + ADC)",
      `Engine: ${json.tokenVerificationEngine}, Project: ${json.cloudProject}, SecretManager: ${json.secretManagerConfigured}, Model: ${json.selectedModel}`
    );
  } catch (err) {
    assert(false, "Test 9: Security Posture Status Verification", err.message);
  }

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passedCount}/${totalCount} TESTS PASSED`);
  console.log("==================================================");

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runTests();
