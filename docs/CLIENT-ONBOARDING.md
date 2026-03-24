# Client Onboarding Guide — Email Signature (Add-in Only)

This guide walks you through setting up the Email Signature Management System using the **Outlook Add-in only** deployment model.

> [!IMPORTANT]
> **Add-in Only Limitations:**
> - Signatures are injected client-side via the Outlook Add-in
> - Works on: Outlook Desktop (Windows/Mac), Outlook on the Web (OWA)
> - Does NOT work on: Outlook Mobile (iOS/Android), Classic Outlook
> - Signature injection is **not enforced** — users can modify/remove signatures
> - No relay server or M365 connector is needed

---

## Table of Contents

1. [Azure AD App Registration](#1-azure-ad-app-registration)
2. [Database Setup](#2-database-setup)
3. [Web Dashboard Deployment](#3-web-dashboard-deployment)
4. [Outlook Add-in Deployment](#4-outlook-add-in-deployment)
5. [Verification Checklist](#5-verification-checklist)

---

## 1. Azure AD App Registration

1. Go to **Azure Portal** → **Microsoft Entra ID** → **App Registrations** → **New Registration**
2. Set:
   - **Name**: `Email Signature Manager`
   - **Supported account types**: "Accounts in this organizational directory only" (Single tenant)
   - **Redirect URI**: `https://<your-domain>/api/auth/callback/azure-ad` (Web platform)
3. Note down:
   - **Application (Client) ID** → `AZURE_CLIENT_ID`
   - **Directory (Tenant) ID** → `AZURE_TENANT_ID`
4. Go to **Certificates & Secrets** → **New Client Secret**
   - Copy the secret value immediately → `AZURE_CLIENT_SECRET`
5. Go to **API Permissions** → **Add a permission** → **Microsoft Graph** → **Application permissions**:
   - `User.Read.All`
   - `Group.Read.All`
   - `GroupMember.Read.All`
   - `Directory.Read.All`
6. Click **Grant admin consent for [Your Organization]**

---

## 2. Database Setup

1. Create a PostgreSQL database (we recommend [Neon Postgres](https://neon.tech) for serverless)
2. Copy the connection string → `DATABASE_URL`
3. After deploying the web app, initialize the schema:
   ```bash
   cd web
   npm run db:push
   ```

---

## 3. Web Dashboard Deployment

1. Copy `.env.example` to `.env` and fill in all values
2. Install dependencies:
   ```bash
   cd web
   npm install
   ```
3. Deploy to **Vercel** (recommended) or any Node.js hosting:
   ```bash
   npm run build
   npm run start
   ```
4. Set all environment variables in your hosting platform
5. After deployment, visit `https://<your-domain>` and sign in with your Microsoft 365 admin account
6. Sync users from the **Users** page

---

## 4. Outlook Add-in Deployment

1. Open `web/public/add-in/commands.js`
2. Update the configuration:
   ```javascript
   var API_BASE_URL = "https://<your-domain>";
   var ADDIN_TOKEN = "<your-PIXORA_ADDIN_TOKEN>";
   ```
3. Go to **Microsoft 365 Admin Center** → **Settings** → **Integrated Apps** → **Upload custom apps**
4. Upload `web/public/add-in/manifest.json`
5. Assign to all users or specific groups
6. Wait 24-48 hours for deployment to propagate

### How It Works

When a user composes a new email, reply, or forward in Outlook, the add-in automatically:
1. Detects the compose type (new/reply/forward)
2. Calls `GET /api/signature?email=<user>&composeType=<type>&format=json`
3. If the settings allow it, injects the rendered HTML signature into the email body

---

## 5. Verification Checklist

- [ ] Azure AD app registered with correct permissions and admin consent granted
- [ ] Database created and schema pushed
- [ ] Web dashboard deployed and accessible
- [ ] Can sign in with Microsoft 365 account
- [ ] Users synced from Microsoft 365
- [ ] At least one signature template created and set as default
- [ ] At least one rule created to assign resources to users
- [ ] Outlook add-in deployed to users via Admin Center
- [ ] Signature appears in Outlook desktop when composing a new email
- [ ] Signature appears in Outlook on the Web when composing a new email
