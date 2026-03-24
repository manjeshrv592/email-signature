/* ═══════════════════════════════════════════════════════════════════
 * Digital Whale — Outlook Add-in (Event-Based Signature Injection)
 * ═══════════════════════════════════════════════════════════════════
 *
 * This script runs headlessly when a user composes a new email or
 * creates a calendar appointment. It fetches the user's rendered
 * signature from the API and injects it via setSignatureAsync().
 *
 * Requires Mailbox requirement set 1.10+.
 * See: https://learn.microsoft.com/office/dev/add-ins/outlook/autolaunch
 * ═══════════════════════════════════════════════════════════════════ */

// ─── Configuration ──────────────────────────────────────────────────
// IMPORTANT: Update these values before deploying.
// API_BASE_URL should point to your hosted deployment (no trailing slash).
// ADDIN_TOKEN must match the PIXORA_ADDIN_TOKEN env var on the server.

var API_BASE_URL = "https://digitalwhale.vercel.app";
var ADDIN_TOKEN = "XDW8UEvf9Ms4IotAjl50xurAyWeGrtXrwt9C90kmEDgTz5Cmpy";

// ─── Office.js Initialization ───────────────────────────────────────
// See: https://learn.microsoft.com/javascript/api/office#office-office-onready-member(1)

Office.onReady(function (info) {
    if (info.host === Office.HostType.Outlook) {
        // Runtime is ready — event handlers are registered via Office.actions.associate below.
    }
});

// ─── Compose Type Mapping ───────────────────────────────────────────
// Maps Office.js ComposeType values to our API query parameter values.
// See: https://learn.microsoft.com/javascript/api/outlook/office.mailboxenums.composetype

function mapComposeType(officeComposeType) {
    if (!officeComposeType) return "newMail";

    switch (officeComposeType) {
        case "reply":
            return "reply";
        case "replyAll":
            return "replyAll";
        case "forward":
            return "forward";
        case "newMail":
        default:
            return "newMail";
    }
}

// ─── Fetch Signature from API ───────────────────────────────────────

function fetchSignature(email, composeType, callback) {
    var url =
        API_BASE_URL +
        "/api/signature?email=" +
        encodeURIComponent(email) +
        "&composeType=" +
        encodeURIComponent(composeType) +
        "&format=json";

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader("Authorization", "Bearer " + ADDIN_TOKEN);
    xhr.setRequestHeader("Accept", "application/json");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    callback(null, data);
                } catch (e) {
                    callback(new Error("Failed to parse signature response"));
                }
            } else {
                callback(
                    new Error("Signature API returned status " + xhr.status)
                );
            }
        }
    };

    xhr.onerror = function () {
        callback(new Error("Network error calling signature API"));
    };

    xhr.send();
}

// ─── Apply Signature ────────────────────────────────────────────────
// Uses setSignatureAsync (Mailbox 1.10+) to inject the signature HTML.
// See: https://learn.microsoft.com/javascript/api/outlook/office.body#outlook-office-body-setsignatureasync-member(1)

function applySignature(item, signatureHtml, callback) {
    item.body.setSignatureAsync(
        signatureHtml,
        { coercionType: Office.CoercionType.Html },
        function (result) {
            if (result.status === Office.AsyncResultStatus.Failed) {
                console.warn(
                    "Digital Whale: setSignatureAsync failed —",
                    result.error.message
                );
            }
            callback();
        }
    );
}

// ─── Event Handler: New Message Compose ─────────────────────────────
// Triggered by OnNewMessageCompose LaunchEvent.
// See: https://learn.microsoft.com/office/dev/add-ins/outlook/autolaunch

function onNewMessageCompose(event) {
    var item = Office.context.mailbox.item;
    var userEmail = Office.context.mailbox.userProfile.emailAddress;

    if (!userEmail) {
        event.completed();
        return;
    }

    // Check if getComposeTypeAsync is available (Mailbox 1.10+)
    if (typeof item.getComposeTypeAsync === "function") {
        item.getComposeTypeAsync(function (result) {
            var composeType = "newMail";
            if (result.status === Office.AsyncResultStatus.Succeeded) {
                composeType = mapComposeType(result.value);
            }
            handleSignatureInjection(item, userEmail, composeType, event);
        });
    } else {
        // Fallback: assume new mail if API not available
        handleSignatureInjection(item, userEmail, "newMail", event);
    }
}

// ─── Event Handler: New Appointment Organizer ───────────────────────
// Triggered by OnNewAppointmentOrganizer LaunchEvent.

function onNewAppointment(event) {
    var item = Office.context.mailbox.item;
    var userEmail = Office.context.mailbox.userProfile.emailAddress;

    if (!userEmail) {
        event.completed();
        return;
    }

    handleSignatureInjection(item, userEmail, "calendar", event);
}

// ─── Shared Injection Logic ─────────────────────────────────────────

function handleSignatureInjection(item, email, composeType, event) {
    fetchSignature(email, composeType, function (err, data) {
        if (err) {
            console.warn("Digital Whale: Could not fetch signature —", err.message);
            event.completed();
            return;
        }

        // If the API says signature shouldn't be applied, skip
        if (!data || !data.applied || !data.html) {
            event.completed();
            return;
        }

        applySignature(item, data.html, function () {
            event.completed();
        });
    });
}

// ─── Register Event Handlers ────────────────────────────────────────
// These function names must match the FunctionName attributes in manifest.xml.
// See: https://learn.microsoft.com/javascript/api/office/office.actions#office-office-actions-associate-member(1)

Office.actions.associate("onNewMessageCompose", onNewMessageCompose);
Office.actions.associate("onNewAppointment", onNewAppointment);
