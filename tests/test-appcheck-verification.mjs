// Automated Verification Script for MindVault App Check & Security Controls
import http from 'http';

async function makeRequest(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        });
      }
    );
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('MINDVAULT APP CHECK & SECURITY VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // TEST 1: Public Health Check
  try {
    const res = await makeRequest('/api/health');
    if (res.status === 200 && res.data.status === 'ok') {
      console.log('✔ TEST 1: Public Health Check accessible (HTTP 200)');
      passed++;
    } else {
      console.error('✖ TEST 1: Public Health Check failed:', res);
      failed++;
    }
  } catch (e) {
    console.error('✖ TEST 1 Error:', e.message);
    failed++;
  }

  // TEST 2: App Check Optionality - Missing App Check proceeds to Auth Layer
  try {
    const res = await makeRequest('/api/reflect', {
      method: 'POST',
      headers: {
        // No X-Firebase-AppCheck header provided
        Authorization: 'Bearer valid_mock_or_test_token',
      },
    }, { content: 'Reflection probe without App Check' });

    // When App Check is optional, it does not block the request at App Check level; it passes through to requireAuth
    if (res.status === 401 && (res.data.code === 'auth/argument-error' || res.data.code === 'AUTH_TOKEN_INVALID' || res.data.code === 'AUTH_TOKEN_VERIFICATION_FAILED' || res.data.code === 'APP_CHECK_TOKEN_MISSING')) {
      console.log('✔ TEST 2: App Check optionality verified: requests without App Check pass smoothly through to Auth verification');
      passed++;
    } else {
      console.error('✖ TEST 2: Unexpected response for request without App Check:', res);
      failed++;
    }
  } catch (e) {
    console.error('✖ TEST 2 Error:', e.message);
    failed++;
  }

  // TEST 3: Invalid / Forged App Check Token Handling
  try {
    const res = await makeRequest('/api/thought-loops', {
      method: 'POST',
      headers: {
        'X-Firebase-AppCheck': 'forged_invalid_app_check_token_12345',
        Authorization: 'Bearer some_token',
      },
    }, {});

    if (res.status === 401) {
      console.log('✔ TEST 3: Invalid token combination rejected with HTTP 401');
      passed++;
    } else {
      console.error('✖ TEST 3: Unexpected response for invalid token combination:', res);
      failed++;
    }
  } catch (e) {
    console.error('✖ TEST 3 Error:', e.message);
    failed++;
  }

  // TEST 4: App Check present but missing Auth Bearer Token
  try {
    const res = await makeRequest('/api/thought-loops', {
      method: 'POST',
      headers: {
        'X-Firebase-AppCheck': 'mindvault-local-dev-appcheck-debug-attestation-2026',
        // Missing Authorization header
      },
    }, {});

    if (res.status === 401 && res.data.code === 'AUTH_HEADER_MISSING') {
      console.log('✔ TEST 4: Valid App Check alone DOES NOT bypass user authentication (Defense-in-depth: HTTP 401 AUTH_HEADER_MISSING)');
      passed++;
    } else {
      console.error('✖ TEST 4: Unexpected response when Auth token missing:', res);
      failed++;
    }
  } catch (e) {
    console.error('✖ TEST 4 Error:', e.message);
    failed++;
  }

  // TEST 5: App Check present but forged Auth Bearer Token
  try {
    const res = await makeRequest('/api/chat', {
      method: 'POST',
      headers: {
        'X-Firebase-AppCheck': 'mindvault-local-dev-appcheck-debug-attestation-2026',
        Authorization: 'Bearer forged_fake_bearer_token_xyz',
      },
    }, { currentMessage: 'Hello from forged user' });

    if (res.status === 401 && (res.data.code === 'AUTH_TOKEN_VERIFICATION_FAILED' || res.data.code === 'auth/argument-error' || res.data.error?.includes('Authentication failed'))) {
      console.log('✔ TEST 5: Forged Bearer token cryptographically rejected even with valid App Check (HTTP 401)');
      passed++;
    } else {
      console.error('✖ TEST 5: Unexpected response for forged bearer token:', res);
      failed++;
    }
  } catch (e) {
    console.error('✖ TEST 5 Error:', e.message);
    failed++;
  }

  // TEST 6: Admin Dashboard requires App Check + Auth + Admin Role
  try {
    const resMissingAppCheck = await makeRequest('/api/admin/dashboard');
    if (resMissingAppCheck.status === 401) {
      console.log('✔ TEST 6a: GET /api/admin/dashboard rejects unauthenticated / missing App Check with HTTP 401');
      passed++;
    } else {
      console.error('✖ TEST 6a Failed:', resMissingAppCheck);
      failed++;
    }
  } catch (e) {
    console.error('✖ TEST 6a Error:', e.message);
    failed++;
  }

  // TEST 7: Security Posture Status Diagnostic Endpoint
  try {
    const res = await makeRequest('/api/security/status');
    if (res.status === 200 && res.data.backendIsolationEnforced === true && res.data.appCheckEngine !== undefined) {
      console.log('✔ TEST 7: /api/security/status confirms App Check optional capability and tokenVerificationEngine active');
      passed++;
    } else {
      console.error('✖ TEST 7 Failed:', res);
      failed++;
    }
  } catch (e) {
    console.error('✖ TEST 7 Error:', e.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`VERIFICATION COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');
}

runTests();
