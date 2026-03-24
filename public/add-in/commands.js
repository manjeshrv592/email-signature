/* ═══════════════════════════════════════════════════════════════════
 * Pixora Outlook Add-in — Event-Based Signature Injection
 * ═══════════════════════════════════════════════════════════════════
 *
 * This script runs headlessly when a user composes a new email or
 * creates a new calendar appointment. It fetches the user's rendered
 * signature from the Pixora API and injects it via setSignatureAsync().
 *
 * The relay server is the authoritative source of truth — this add-in
 * provides a best-effort client-side preview.
 * ═══════════════════════════════════════════════════════════════════ */

// ─── Configuration ──────────────────────────────────────────────────
// IMPORTANT: Update these values before deploying.
// API_BASE_URL should point to your Vercel deployment (no trailing slash).
// ADDIN_TOKEN must match the PIXORA_ADDIN_TOKEN env var on the server.

var API_BASE_URL = "https://pixora365.vercel.app";
var ADDIN_TOKEN = "XDW8UEvf9Ms4IotAjl50xurAyWeGrtXrwt9C90kmEDgTz5Cmpy";

// ─── Office.js Initialization ───────────────────────────────────────

Office.onReady(function (info) {
    if (info.host === Office.HostType.Outlook) {
        // Runtime is ready — event handlers are registered via actions.associate below.
    }
});

// ─── Compose Type Mapping ───────────────────────────────────────────
// Office.js getComposeTypeAsync returns values like:
//   Office.MailboxEnums.ComposeType.newMail
//   Office.MailboxEnums.ComposeType.reply
//   Office.MailboxEnums.ComposeType.forward
// We map these to our API's query parameter values.

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

function applySignature(item, signatureHtml, callback) {
    item.body.setSignatureAsync(
        signatureHtml,
        { coercionType: Office.CoercionType.Html },
        function (result) {
            if (result.status === Office.AsyncResultStatus.Failed) {
                console.warn(
                    "Pixora: setSignatureAsync failed —",
                    result.error.message
                );
            }
            callback();
        }
    );
}

// ─── Event Handler: New Message Compose ─────────────────────────────

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
            console.warn("Pixora: Could not fetch signature —", err.message);
            event.completed();
            return;
        }

        // If the API says signature shouldn't be applied, skip
        if (!data || !data.applied || !data.html) {
            event.completed();
            return;
        }

        // Wrap in Pixora markers so the relay server can strip it later
        var wrappedHtml =
            "<!-- pixora-signature-start -->" +
            data.html +
            "<!-- pixora-signature-end -->";

        applySignature(item, wrappedHtml, function () {
            event.completed();
        });
    });
}

// ─── Register Event Handlers ────────────────────────────────────────
// These actionIds must match the manifest's autoRunEvents configuration.

Office.actions.associate("onNewMessageCompose", onNewMessageCompose);
Office.actions.associate("onNewAppointment", onNewAppointment);
