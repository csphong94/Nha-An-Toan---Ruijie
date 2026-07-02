---
name: security-check
description: Guidelines for sanitizing inputs, verifying payment signatures, and securing admin API endpoints.
---

# Security & Input Sanitization Skill

This skill outlines guidelines to secure the Captive Portal billing system against common web vulnerabilities.

## Guidelines

1. **Input Sanitization**:
   - Always sanitize `customerName` and `customerPhone` in `server/index.js` to strip HTML tags and prevent XSS (Cross-Site Scripting) in the Admin dashboard.
   - Example helper:
     ```javascript
     const cleanInput = (str) => String(str).replace(/[<>]/g, "");
     ```

2. **Signature Verification**:
   - For all MoMo IPN callbacks (`/api/payment/momo/ipn`), check and verify the payment gateway signature to prevent fraudulent requests from mocking successful payments.

3. **Admin Token Authorization**:
   - Ensure all routes starting with `/api/admin/` require a valid JWT or matching `adminPassword`.
   - Never expose API credentials or passwords in frontend code (`dist/` or `src/`). Always proxy credentials through the Node.js backend.
