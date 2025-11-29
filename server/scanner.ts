import axios from "axios";
import * as cheerio from "cheerio";
import { storage } from "./storage";
import type { InsertVulnerability } from "@shared/schema";

interface ScanResult {
  vulnerabilities: InsertVulnerability[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export async function performScan(scanId: string, targetUrl: string, scanType: string): Promise<ScanResult> {
  const vulnerabilities: InsertVulnerability[] = [];
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  try {
    // Validate and normalize URL
    const url = new URL(targetUrl);
    
    // Update scan status to running
    await storage.updateScan(scanId, { 
      status: "running", 
      startedAt: new Date() 
    });

    // Perform HTTP request
    const response = await axios.get(targetUrl, {
      timeout: 30000,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'ZAP-Scanner/1.0',
      },
    });

    const headers = response.headers;
    const html = response.data;

    // Check security headers
    const headerChecks = checkSecurityHeaders(scanId, targetUrl, headers);
    vulnerabilities.push(...headerChecks);

    // Check for HTTPS
    if (url.protocol !== "https:") {
      vulnerabilities.push({
        scanId,
        type: "Insecure Protocol",
        severity: "High",
        title: "Website not using HTTPS",
        description: "The website is not using HTTPS encryption. All data transmitted between the user and the server can be intercepted by attackers.",
        affectedUrl: targetUrl,
        remediation: "Configure the server to use HTTPS with a valid SSL/TLS certificate. Redirect all HTTP traffic to HTTPS.",
        details: { protocol: url.protocol },
      });
    }

    // Parse HTML and check for vulnerabilities
    if (typeof html === "string") {
      const $ = cheerio.load(html);

      // Check for potential XSS vulnerabilities
      const xssChecks = checkXSSVulnerabilities(scanId, targetUrl, $);
      vulnerabilities.push(...xssChecks);

      // Check for forms without CSRF protection
      const formChecks = checkFormSecurity(scanId, targetUrl, $);
      vulnerabilities.push(...formChecks);

      // Check for information disclosure
      const infoChecks = checkInformationDisclosure(scanId, targetUrl, $, html);
      vulnerabilities.push(...infoChecks);

      // Deep scan additional checks
      if (scanType === "deep" || scanType === "full") {
        const deepChecks = performDeepScan(scanId, targetUrl, $, html);
        vulnerabilities.push(...deepChecks);
      }
    }

    // Count severities
    for (const vuln of vulnerabilities) {
      switch (vuln.severity) {
        case "Critical": criticalCount++; break;
        case "High": highCount++; break;
        case "Medium": mediumCount++; break;
        case "Low": lowCount++; break;
      }
    }

    // Save vulnerabilities to storage
    for (const vuln of vulnerabilities) {
      await storage.createVulnerability(vuln);
    }

    // Update scan with results
    await storage.updateScan(scanId, {
      status: "completed",
      completedAt: new Date(),
      totalVulnerabilities: vulnerabilities.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
    });

  } catch (error: any) {
    // Handle scan errors
    const errorMessage = error.message || "Unknown error occurred";
    
    await storage.updateScan(scanId, {
      status: "failed",
      completedAt: new Date(),
    });

    // Add error as a finding
    vulnerabilities.push({
      scanId,
      type: "Scan Error",
      severity: "Low",
      title: "Unable to complete scan",
      description: `The scan could not be completed: ${errorMessage}`,
      affectedUrl: targetUrl,
      remediation: "Verify the URL is accessible and try again.",
      details: { error: errorMessage },
    });
  }

  return {
    vulnerabilities,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
  };
}

function checkSecurityHeaders(scanId: string, targetUrl: string, headers: Record<string, any>): InsertVulnerability[] {
  const vulns: InsertVulnerability[] = [];

  // Check X-Frame-Options
  if (!headers["x-frame-options"]) {
    vulns.push({
      scanId,
      type: "Missing Security Header",
      severity: "Medium",
      title: "Missing X-Frame-Options Header",
      description: "The X-Frame-Options header is not set. This can lead to clickjacking attacks where an attacker can embed your site in an iframe.",
      affectedUrl: targetUrl,
      remediation: "Add the X-Frame-Options header with value 'DENY' or 'SAMEORIGIN' to prevent clickjacking.",
      details: { header: "X-Frame-Options" },
    });
  }

  // Check Content-Security-Policy
  if (!headers["content-security-policy"]) {
    vulns.push({
      scanId,
      type: "Missing Security Header",
      severity: "Medium",
      title: "Missing Content-Security-Policy Header",
      description: "The Content-Security-Policy header is not set. CSP helps prevent XSS attacks by controlling which resources can be loaded.",
      affectedUrl: targetUrl,
      remediation: "Implement a Content-Security-Policy header that restricts resource loading to trusted sources.",
      details: { header: "Content-Security-Policy" },
    });
  }

  // Check X-Content-Type-Options
  if (!headers["x-content-type-options"]) {
    vulns.push({
      scanId,
      type: "Missing Security Header",
      severity: "Low",
      title: "Missing X-Content-Type-Options Header",
      description: "The X-Content-Type-Options header is not set. This can lead to MIME type sniffing attacks.",
      affectedUrl: targetUrl,
      remediation: "Add the X-Content-Type-Options header with value 'nosniff'.",
      details: { header: "X-Content-Type-Options" },
    });
  }

  // Check Strict-Transport-Security
  if (!headers["strict-transport-security"]) {
    vulns.push({
      scanId,
      type: "Missing Security Header",
      severity: "Medium",
      title: "Missing Strict-Transport-Security Header",
      description: "The HSTS header is not set. This allows attackers to downgrade connections from HTTPS to HTTP.",
      affectedUrl: targetUrl,
      remediation: "Add the Strict-Transport-Security header with appropriate max-age value.",
      details: { header: "Strict-Transport-Security" },
    });
  }

  // Check X-XSS-Protection
  if (!headers["x-xss-protection"]) {
    vulns.push({
      scanId,
      type: "Missing Security Header",
      severity: "Low",
      title: "Missing X-XSS-Protection Header",
      description: "The X-XSS-Protection header is not set. Modern browsers have built-in XSS filtering, but this header provides additional protection.",
      affectedUrl: targetUrl,
      remediation: "Add the X-XSS-Protection header with value '1; mode=block'.",
      details: { header: "X-XSS-Protection" },
    });
  }

  // Check for server information disclosure
  if (headers["server"]) {
    vulns.push({
      scanId,
      type: "Information Disclosure",
      severity: "Low",
      title: "Server Version Disclosure",
      description: `The server is disclosing its version information: ${headers["server"]}. This information can help attackers identify known vulnerabilities.`,
      affectedUrl: targetUrl,
      remediation: "Configure the server to hide or obfuscate the Server header.",
      details: { serverHeader: headers["server"] },
    });
  }

  return vulns;
}

function checkXSSVulnerabilities(scanId: string, targetUrl: string, $: cheerio.CheerioAPI): InsertVulnerability[] {
  const vulns: InsertVulnerability[] = [];

  // Check for inline event handlers
  const inlineEvents = $("[onclick], [onerror], [onload], [onmouseover], [onfocus], [onblur]");
  if (inlineEvents.length > 0) {
    vulns.push({
      scanId,
      type: "Potential XSS",
      severity: "Medium",
      title: "Inline JavaScript Event Handlers Detected",
      description: `Found ${inlineEvents.length} elements with inline JavaScript event handlers. These can be exploited for XSS attacks if user input is reflected.`,
      affectedUrl: targetUrl,
      remediation: "Use addEventListener() instead of inline event handlers. Ensure all user input is properly sanitized.",
      details: { count: inlineEvents.length },
    });
  }

  // Check for javascript: URLs
  const jsUrls = $("a[href^='javascript:']");
  if (jsUrls.length > 0) {
    vulns.push({
      scanId,
      type: "Potential XSS",
      severity: "High",
      title: "JavaScript URL Scheme Detected",
      description: `Found ${jsUrls.length} links using the javascript: URL scheme. This can be exploited for XSS attacks.`,
      affectedUrl: targetUrl,
      remediation: "Remove javascript: URLs and use proper event handling instead.",
      details: { count: jsUrls.length },
    });
  }

  // Check for inline scripts without nonce
  const inlineScripts = $("script:not([src])");
  if (inlineScripts.length > 0) {
    const hasNonce = inlineScripts.toArray().some(el => $(el).attr("nonce"));
    if (!hasNonce) {
      vulns.push({
        scanId,
        type: "Potential XSS",
        severity: "Low",
        title: "Inline Scripts Without Nonce",
        description: `Found ${inlineScripts.length} inline scripts without CSP nonces. This may indicate weak XSS protection.`,
        affectedUrl: targetUrl,
        remediation: "Use CSP with nonces for inline scripts or move scripts to external files.",
        details: { count: inlineScripts.length },
      });
    }
  }

  return vulns;
}

function checkFormSecurity(scanId: string, targetUrl: string, $: cheerio.CheerioAPI): InsertVulnerability[] {
  const vulns: InsertVulnerability[] = [];

  const forms = $("form");
  forms.each((_, form) => {
    const $form = $(form);
    const action = $form.attr("action") || targetUrl;
    const method = ($form.attr("method") || "GET").toUpperCase();

    // Check for CSRF token
    const hasCsrfToken = $form.find("input[name*='csrf'], input[name*='token'], input[name*='_token']").length > 0;
    
    if (method === "POST" && !hasCsrfToken) {
      vulns.push({
        scanId,
        type: "CSRF",
        severity: "High",
        title: "Form Without CSRF Protection",
        description: "A POST form was found without an apparent CSRF token. This may allow attackers to submit malicious requests on behalf of authenticated users.",
        affectedUrl: targetUrl,
        remediation: "Implement CSRF tokens for all forms that modify data. Use a secure, random token that is validated on the server.",
        details: { formAction: action, method },
      });
    }

    // Check for password fields over HTTP
    const hasPassword = $form.find("input[type='password']").length > 0;
    if (hasPassword && !targetUrl.startsWith("https")) {
      vulns.push({
        scanId,
        type: "Insecure Transport",
        severity: "Critical",
        title: "Password Field Over HTTP",
        description: "A password input field is present on a page served over unencrypted HTTP. Passwords will be transmitted in plain text.",
        affectedUrl: targetUrl,
        remediation: "Serve all pages with password fields over HTTPS only.",
        details: { formAction: action },
      });
    }

    // Check for autocomplete on sensitive fields
    const sensitiveInputs = $form.find("input[type='password'], input[name*='credit'], input[name*='card'], input[name*='ssn']");
    sensitiveInputs.each((_, input) => {
      const autocomplete = $(input).attr("autocomplete");
      if (autocomplete !== "off" && autocomplete !== "new-password") {
        vulns.push({
          scanId,
          type: "Sensitive Data",
          severity: "Low",
          title: "Autocomplete Enabled on Sensitive Field",
          description: "A sensitive input field has autocomplete enabled. This may allow data to be stored in the browser.",
          affectedUrl: targetUrl,
          remediation: "Set autocomplete='off' or autocomplete='new-password' on sensitive input fields.",
          details: { inputName: $(input).attr("name") || "unknown" },
        });
      }
    });
  });

  return vulns;
}

function checkInformationDisclosure(scanId: string, targetUrl: string, $: cheerio.CheerioAPI, html: string): InsertVulnerability[] {
  const vulns: InsertVulnerability[] = [];

  // Check for HTML comments with sensitive info
  const commentPattern = /<!--[\s\S]*?(password|secret|api[_-]?key|token|credential|todo|fixme|hack|bug)[\s\S]*?-->/gi;
  const matches = html.match(commentPattern);
  if (matches && matches.length > 0) {
    vulns.push({
      scanId,
      type: "Information Disclosure",
      severity: "Medium",
      title: "Sensitive Information in HTML Comments",
      description: `Found ${matches.length} HTML comments that may contain sensitive information or development notes.`,
      affectedUrl: targetUrl,
      remediation: "Remove all comments containing sensitive information or development notes from production code.",
      details: { count: matches.length },
    });
  }

  // Check for exposed email addresses
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = html.match(emailPattern);
  if (emails && emails.length > 3) {
    vulns.push({
      scanId,
      type: "Information Disclosure",
      severity: "Low",
      title: "Multiple Email Addresses Exposed",
      description: `Found ${emails.length} email addresses in the page source. These may be harvested for spam or phishing attacks.`,
      affectedUrl: targetUrl,
      remediation: "Consider obfuscating email addresses or using contact forms instead.",
      details: { count: emails.length },
    });
  }

  // Check for error messages
  const errorPatterns = [
    /fatal error/i,
    /stack trace/i,
    /exception in/i,
    /syntax error/i,
    /undefined index/i,
    /mysql_/i,
    /mysqli_/i,
    /pg_query/i,
  ];
  
  for (const pattern of errorPatterns) {
    if (pattern.test(html)) {
      vulns.push({
        scanId,
        type: "Information Disclosure",
        severity: "High",
        title: "Error Message Disclosure",
        description: "The page contains error messages that may reveal sensitive information about the application or database.",
        affectedUrl: targetUrl,
        remediation: "Configure the application to hide detailed error messages in production. Log errors securely on the server.",
        details: { pattern: pattern.toString() },
      });
      break;
    }
  }

  return vulns;
}

function performDeepScan(scanId: string, targetUrl: string, $: cheerio.CheerioAPI, html: string): InsertVulnerability[] {
  const vulns: InsertVulnerability[] = [];

  // Check for mixed content
  const httpResources = $("script[src^='http:'], link[href^='http:'], img[src^='http:']");
  if (httpResources.length > 0 && targetUrl.startsWith("https")) {
    vulns.push({
      scanId,
      type: "Mixed Content",
      severity: "Medium",
      title: "Mixed Content Detected",
      description: `Found ${httpResources.length} resources loaded over HTTP on an HTTPS page. This can compromise security.`,
      affectedUrl: targetUrl,
      remediation: "Load all resources over HTTPS or use protocol-relative URLs.",
      details: { count: httpResources.length },
    });
  }

  // Check for outdated libraries
  const jqueryVersion = html.match(/jquery[.-]?(\d+\.\d+\.\d+)/i);
  if (jqueryVersion && jqueryVersion[1]) {
    const version = jqueryVersion[1].split(".").map(Number);
    if (version[0] < 3 || (version[0] === 3 && version[1] < 5)) {
      vulns.push({
        scanId,
        type: "Outdated Library",
        severity: "Medium",
        title: "Outdated jQuery Version",
        description: `jQuery version ${jqueryVersion[1]} detected. Older versions may contain known security vulnerabilities.`,
        affectedUrl: targetUrl,
        remediation: "Update jQuery to the latest stable version (3.7.x or newer).",
        details: { version: jqueryVersion[1] },
      });
    }
  }

  // Check for open redirects
  const links = $("a[href*='redirect'], a[href*='url='], a[href*='goto='], a[href*='next=']");
  if (links.length > 0) {
    vulns.push({
      scanId,
      type: "Open Redirect",
      severity: "Medium",
      title: "Potential Open Redirect",
      description: `Found ${links.length} links with redirect parameters. These may be exploitable for phishing attacks.`,
      affectedUrl: targetUrl,
      remediation: "Validate and whitelist all redirect destinations. Avoid using user-controlled input for redirects.",
      details: { count: links.length },
    });
  }

  // Check for meta refresh
  const metaRefresh = $("meta[http-equiv='refresh']");
  if (metaRefresh.length > 0) {
    vulns.push({
      scanId,
      type: "Information",
      severity: "Low",
      title: "Meta Refresh Tag Detected",
      description: "A meta refresh tag is present which may be used for redirects. Ensure it doesn't redirect to untrusted destinations.",
      affectedUrl: targetUrl,
      remediation: "Use server-side redirects instead of meta refresh tags.",
      details: { content: metaRefresh.attr("content") },
    });
  }

  return vulns;
}

export async function getLastScanTime(): Promise<string> {
  const scans = await storage.getRecentScans(1);
  if (scans.length === 0) {
    return "Never";
  }
  const lastScan = scans[0];
  if (lastScan.completedAt) {
    const diff = Date.now() - new Date(lastScan.completedAt).getTime();
    if (diff < 60000) return "Just Now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return new Date(lastScan.completedAt).toLocaleDateString();
  }
  return "In Progress";
}
