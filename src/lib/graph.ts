/**
 * Microsoft Graph API client helper
 * Uses client credentials flow (app-only) to read all users/groups
 * Single-tenant: uses env vars for Azure credentials
 */

// ─── Token Management ────────────────────────────────────────

interface TokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
}

let cachedToken: { accessToken: string; expiresAt: number } | null = null;
const TOKEN_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get an app-only access token for Microsoft Graph using client credentials.
 */
export async function getGraphAccessToken(): Promise<string> {
    // Check cache first
    if (cachedToken && cachedToken.expiresAt > Date.now()) {
        return cachedToken.accessToken;
    }

    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const tenantId = process.env.AZURE_TENANT_ID;

    if (!clientId || !clientSecret || !tenantId) {
        throw new Error("Missing Azure AD credentials (AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID)");
    }

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
    });

    const response = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get Graph access token: ${response.status} ${errorText}`);
    }

    const data: TokenResponse = await response.json();

    cachedToken = {
        accessToken: data.access_token,
        expiresAt: Date.now() + (data.expires_in * 1000) - TOKEN_BUFFER_MS,
    };

    return data.access_token;
}

// ─── Graph API Types ─────────────────────────────────────────

export interface GraphUser {
    id: string;
    displayName: string | null;
    mail: string | null;
    userPrincipalName: string;
    jobTitle: string | null;
    department: string | null;
    country: string | null;
    city: string | null;
    businessPhones: string[];
}

export interface GraphGroup {
    id: string;
    displayName: string;
}

export interface GraphGroupMember {
    "@odata.type": string;
    id: string;
    displayName: string | null;
    mail: string | null;
    userPrincipalName?: string;
}

interface GraphPagedResponse<T> {
    value: T[];
    "@odata.nextLink"?: string;
}

// ─── Paginated Fetch Helper ──────────────────────────────────

async function fetchAllPages<T>(url: string, accessToken: string): Promise<T[]> {
    const allItems: T[] = [];
    let nextUrl: string | undefined = url;

    while (nextUrl) {
        const response = await fetch(nextUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Graph API error: ${response.status} ${errorText}`);
        }

        const data: GraphPagedResponse<T> = await response.json();
        allItems.push(...data.value);
        nextUrl = data["@odata.nextLink"];
    }

    return allItems;
}

// ─── Graph API Functions ─────────────────────────────────────

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

const USER_SELECT_FIELDS = [
    "id",
    "displayName",
    "mail",
    "userPrincipalName",
    "jobTitle",
    "department",
    "country",
    "city",
    "businessPhones",
].join(",");

/**
 * Fetch all users via MS Graph.
 * Filters out guest/external accounts — only returns members.
 */
export async function fetchGraphUsers(accessToken: string): Promise<GraphUser[]> {
    const url = `${GRAPH_BASE}/users?$select=${USER_SELECT_FIELDS}&$filter=userType eq 'Member'&$top=999`;
    return fetchAllPages<GraphUser>(url, accessToken);
}

/**
 * Fetch all groups via MS Graph.
 */
export async function fetchGraphGroups(accessToken: string): Promise<GraphGroup[]> {
    const url = `${GRAPH_BASE}/groups?$select=id,displayName&$filter=groupTypes/any(g:g eq 'Unified') or mailEnabled eq false&$top=999`;
    return fetchAllPages<GraphGroup>(url, accessToken);
}

/**
 * Fetch all members of a specific group.
 */
export async function fetchGraphGroupMembers(
    accessToken: string,
    groupId: string
): Promise<GraphGroupMember[]> {
    const url = `${GRAPH_BASE}/groups/${groupId}/members?$select=id,displayName,mail,userPrincipalName&$top=999`;
    const allMembers = await fetchAllPages<GraphGroupMember>(url, accessToken);
    return allMembers.filter((m) => m["@odata.type"] === "#microsoft.graph.user");
}

/**
 * Fetch a user's profile photo from MS Graph.
 */
export async function fetchGraphUserPhoto(
    accessToken: string,
    userId: string
): Promise<string | null> {
    try {
        const url = `${GRAPH_BASE}/users/${userId}/photo/$value`;
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            return null;
        }

        const contentType = response.headers.get("Content-Type") || "image/jpeg";
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        return `data:${contentType};base64,${base64}`;
    } catch {
        return null;
    }
}
