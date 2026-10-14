#!/usr/bin/env node

/**
 * AgriME data.gov.in Diagnostic & Network Connectivity Probe
 * ------------------------------------------------------------
 * Diagnoses the exact root cause of connectivity failures to data.gov.in:
 * 1. Environment & API Key validation (redacted, never printed)
 * 2. DNS resolution (IPv4 vs IPv6 addresses)
 * 3. TCP socket connection to port 443
 * 4. TLS handshake & certificate validity
 * 5. HTTP GET requests with various headers and parameter formats
 */

import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns';
import dnsPromises from 'node:dns/promises';
import net from 'node:net';
import tls from 'node:tls';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT_DIR, '.env.local');

const HOSTNAME = 'api.data.gov.in';
const RESOURCE_ID = '35985678-0d79-46b4-9ed6-6f13308a1d24';

console.log('================================================================');
console.log('🔍 AgriME data.gov.in Mandi API Connectivity Diagnostic');
console.log('================================================================\n');

// 1. Check API Key in .env.local
let apiKey = process.env.DATA_GOV_IN_API_KEY;
let keySource = 'process.env';

if (!apiKey && fs.existsSync(ENV_PATH)) {
  const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATA_GOV_IN_API_KEY=')) {
      apiKey = trimmed.substring('DATA_GOV_IN_API_KEY='.length).trim();
      keySource = '.env.local file';
      break;
    }
  }
}

const keyLoaded = Boolean(apiKey && apiKey.length > 0);
const keyLength = apiKey ? apiKey.length : 0;
const keyHasWhitespace = apiKey ? /\s/.test(apiKey) : false;
const keyIsSample = apiKey ? (apiKey.includes('your-') || apiKey.includes('optional')) : false;

console.log('1. API Key Status:');
console.log(`   • Key Present:        ${keyLoaded ? '✅ YES' : '❌ NO'}`);
console.log(`   • Loaded From:        ${keySource}`);
console.log(`   • Key Length:         ${keyLength} chars`);
console.log(`   • Format Check:       ${!keyHasWhitespace ? '✅ Valid (no whitespace)' : '⚠️ Contains whitespace'}`);
console.log(`   • Not Placeholder:    ${!keyIsSample ? '✅ Authentic key' : '⚠️ Placeholder detected'}\n`);

async function runDiagnostics() {
  const report = {
    timestamp: new Date().toISOString(),
    apiKey: {
      loaded: keyLoaded,
      source: keySource,
      length: keyLength,
      validFormat: !keyHasWhitespace && !keyIsSample
    },
    dns: {},
    tcp: {},
    tls: {},
    http: {}
  };

  // 2. DNS Resolution Probe
  console.log('2. DNS Resolution Probe:');
  try {
    const addresses = await dnsPromises.lookup(HOSTNAME, { all: true });
    report.dns = { success: true, addresses };
    console.log(`   • Resolved ${HOSTNAME}:`);
    addresses.forEach((a) => {
      console.log(`     - Family ${a.family}: ${a.address}`);
    });
  } catch (err) {
    report.dns = { success: false, error: err.message, code: err.code };
    console.log(`   ❌ DNS resolution failed: ${err.message} (${err.code})`);
  }
  console.log('');

  // 3. TCP Port 443 Connectivity:
  console.log('3. TCP Port 443 Connectivity:');
  const probeSocket = (opts, label, timeoutMs = 6000) => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const socket = net.createConnection({ ...opts, timeout: timeoutMs }, () => {
        const elapsed = Date.now() - startTime;
        socket.end();
        resolve({ success: true, elapsedMs: elapsed, label });
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({ success: false, error: `Connection timed out after ${timeoutMs}ms`, code: 'ETIMEDOUT', label });
      });

      socket.on('error', (err) => {
        resolve({ success: false, error: err.message, code: err.code, label });
      });
    });
  };

  const [tcpAuto, tcpIpv4] = await Promise.all([
    probeSocket({ host: HOSTNAME, port: 443, autoSelectFamily: true }, 'Hostname (autoSelectFamily)'),
    probeSocket({ host: HOSTNAME, port: 443, family: 4 }, 'Hostname (IPv4 forced)')
  ]);

  const tcpResult = tcpAuto.success ? tcpAuto : (tcpIpv4.success ? tcpIpv4 : tcpAuto);
  report.tcp = {
    success: tcpAuto.success || tcpIpv4.success,
    autoSelectFamily: tcpAuto,
    ipv4Forced: tcpIpv4,
    elapsedMs: tcpResult.elapsedMs,
    error: tcpResult.error,
    code: tcpResult.code
  };

  console.log(`   • TCP Handshake (Auto):   ${tcpAuto.success ? '✅ Connected in ' + tcpAuto.elapsedMs + 'ms' : '❌ ' + tcpAuto.error}`);
  console.log(`   • TCP Handshake (IPv4):   ${tcpIpv4.success ? '✅ Connected in ' + tcpIpv4.elapsedMs + 'ms' : '❌ ' + tcpIpv4.error}`);
  console.log('');

  // 4. TLS Handshake & Certificate Verification
  console.log('4. TLS Handshake & Certificate Verification:');
  const tlsPromise = new Promise((resolve) => {
    const startTime = Date.now();
    const socket = tls.connect({
      host: HOSTNAME,
      port: 443,
      servername: HOSTNAME,
      timeout: 6000
    }, () => {
      const elapsed = Date.now() - startTime;
      const cert = socket.getPeerCertificate();
      const authorized = socket.authorized;
      const authError = socket.authorizationError;
      socket.end();
      resolve({
        success: true,
        authorized,
        authError: authError ? String(authError) : null,
        elapsedMs: elapsed,
        subjectCN: cert?.subject?.CN,
        issuerO: cert?.issuer?.O,
        validTo: cert?.valid_to
      });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ success: false, error: 'TLS handshake timed out after 6000ms', code: 'ETIMEDOUT' });
    });

    socket.on('error', (err) => {
      resolve({ success: false, error: err.message, code: err.code });
    });
  });

  const tlsResult = await tlsPromise;
  report.tls = tlsResult;
  if (tlsResult.success) {
    console.log(`   • TLS Handshake:      ✅ Succeeded in ${tlsResult.elapsedMs}ms`);
    console.log(`   • Cert Authorized:   ${tlsResult.authorized ? '✅ Authorized' : '❌ Unauthorized: ' + tlsResult.authError}`);
    console.log(`   • Certificate CN:    ${tlsResult.subjectCN}`);
    console.log(`   • Issuer:            ${tlsResult.issuerO}`);
    console.log(`   • Valid Until:       ${tlsResult.validTo}`);
  } else {
    console.log(`   ❌ TLS Handshake failed: ${tlsResult.error} (${tlsResult.code})`);
  }
  console.log('');

  // 5. HTTP API Requests Probe
  console.log('5. HTTP Request Probe to data.gov.in:');
  if (!keyLoaded) {
    console.log('   ⚠️ Skipping HTTP probe: No API key configured.');
  } else if (!tcpResult.success) {
    console.log(`   ⚠️ Skipping HTTP probe: Network cannot establish TCP connection to ${HOSTNAME}:443.`);
  } else {
    // Test A: Minimal Request without filters (latest arrivals)
    const urlA = `https://${HOSTNAME}/resource/${RESOURCE_ID}?api-key=${encodeURIComponent(apiKey)}&format=json&limit=2&sort[Arrival_Date]=desc`;
    console.log('   • Probing Test A: Minimal query (limit=2, sort[Arrival_Date]=desc)...');
    const resultA = await probeHttpRequest(urlA);
    report.http.testA = resultA;
    console.log(`     - Status: ${resultA.statusCode || 'N/A'}`);
    console.log(`     - Elapsed: ${resultA.elapsedMs}ms`);
    if (resultA.success) {
      console.log(`     - Response: ✅ Total=${resultA.body?.total}, Count=${resultA.body?.count}`);
    } else {
      console.log(`     - Error: ❌ ${resultA.error}`);
    }

    // Test B: Query with Tamil Nadu Filter
    const urlB = `https://${HOSTNAME}/resource/${RESOURCE_ID}?api-key=${encodeURIComponent(apiKey)}&format=json&limit=2&filters[State]=Tamil%20Nadu&sort[Arrival_Date]=desc`;
    console.log('   • Probing Test B: Filtered query (filters[State]=Tamil Nadu&sort[Arrival_Date]=desc)...');
    const resultB = await probeHttpRequest(urlB);
    report.http.testB = resultB;
    console.log(`     - Status: ${resultB.statusCode || 'N/A'}`);
    console.log(`     - Elapsed: ${resultB.elapsedMs}ms`);
    if (resultB.success) {
      console.log(`     - Response: ✅ Total=${resultB.body?.total}, Count=${resultB.body?.count}`);
      if (resultB.body?.records?.length > 0) {
        const sample = resultB.body.records[0];
        console.log(`     - Sample record: ${sample.commodity} in ${sample.market} (${sample.district}): Modal ₹${sample.modal_price}/Q on ${sample.arrival_date}`);
      }
    } else {
      console.log(`     - Error: ❌ ${resultB.error}`);
    }
  }

  console.log('\n================================================================');
  console.log('📋 Diagnostic Summary & Root Cause');
  console.log('================================================================');
  
  if (!keyLoaded) {
    console.log('ROOT CAUSE: DATA_GOV_IN_API_KEY is not configured in .env.local.');
  } else if (!report.dns.success) {
    console.log(`ROOT CAUSE: DNS resolution failure for ${HOSTNAME} (${report.dns.error}).`);
  } else if (!report.tcp.success) {
    console.log(`ROOT CAUSE: Network / Firewall Timeout connecting to ${HOSTNAME}:443.`);
    console.log('The machine or network cannot reach the Indian government data gateway.');
    console.log('Common causes: Corporate VPN/firewall, ISP routing to National Informatics Centre (NIC), or temporary NIC server downtime.');
  } else if (!report.tls.success) {
    console.log(`ROOT CAUSE: TLS Handshake / SSL Certificate failure (${report.tls.error}).`);
  } else if (report.http.testA?.statusCode === 403) {
    console.log('ROOT CAUSE: API Key Rejected / Unauthorized (HTTP 403).');
    console.log('The configured key is either invalid, not yet activated on data.gov.in, or rate-limited.');
  } else if (report.http.testA?.statusCode === 429) {
    console.log('ROOT CAUSE: Rate Limit Exceeded (HTTP 429). Over 1,000 requests/hour from this key or IP.');
  } else if (report.http.testB?.success) {
    console.log('✅ ALL SYSTEMS OPERATIONAL: The official data.gov.in API is responding normally.');
  } else {
    console.log('ROOT CAUSE: Upstream data.gov.in API returned an error or timed out.');
  }
  console.log('================================================================\n');

  // Save report
  const outPath = path.join(ROOT_DIR, 'tests', 'api_diagnostic_result.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`Detailed report written to: tests/api_diagnostic_result.json`);
}

function probeHttpRequest(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      },
      timeout: 8000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const elapsed = Date.now() - start;
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data.substring(0, 200);
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, statusCode: res.statusCode, elapsedMs: elapsed, body: parsed });
        } else {
          resolve({ success: false, statusCode: res.statusCode, elapsedMs: elapsed, error: `HTTP ${res.statusCode} ${res.statusMessage}`, body: parsed });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, statusCode: 504, elapsedMs: Date.now() - start, error: 'Request timed out after 8000ms' });
    });

    req.on('error', (err) => {
      resolve({ success: false, elapsedMs: Date.now() - start, error: err.message, code: err.code });
    });
  });
}

runDiagnostics().catch(console.error);
