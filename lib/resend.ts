/**
 * Resend email client for TripAmigos
 * Handles transactional emails: invite notifications, booking confirmations
 */

import { Resend } from 'resend'

// Lazy-initialise so the module loads without errors at build time
// (RESEND_API_KEY may not be available during `next build`)
let _resend: Resend | null = null
function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

const FROM_EMAIL = 'TripAmigos <info@tripamigos.co>'

// =====================================================
// EMAIL TEMPLATES
// =====================================================

function inviteEmailHtml({
  organiserName,
  tripName,
  dateFrom,
  dateTo,
  destinations,
  inviteUrl,
}: {
  organiserName: string
  tripName: string
  dateFrom: string
  dateTo: string
  destinations: string[]
  inviteUrl: string
}): string {
  const destChips = destinations
    .map(d => `<span style="display:inline-block;padding:4px 12px;background:rgba(37,99,235,0.08);color:#2563eb;border-radius:20px;font-size:13px;font-weight:500;margin:2px 4px 2px 0;">${d.split(',')[0]}</span>`)
    .join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f9fb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a1a2e;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fb;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:28px 32px;text-align:center;">
          <span style="font-size:22px;font-weight:600;color:#ffffff;">Trip<span style="opacity:0.9;">Amigos</span></span>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1a2e;">You're invited! 🎉</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
            <strong style="color:#1a1a2e;">${organiserName}</strong> has invited you on a trip and wants to know your preferences.
          </p>

          <!-- Trip card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fb;border-radius:12px;margin-bottom:24px;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#1a1a2e;">${tripName}</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="vertical-align:top;">
                    <p style="margin:0;font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">When</p>
                    <p style="margin:4px 0 0;font-size:14px;font-weight:500;color:#1a1a2e;">${dateFrom} – ${dateTo}</p>
                  </td>
                  <td width="50%" style="vertical-align:top;">
                    <p style="margin:0;font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Destinations</p>
                    <p style="margin:6px 0 0;">${destChips || '<span style="font-size:14px;color:#6b7280;">TBD</span>'}</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- CTA button -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${inviteUrl}" style="display:inline-block;padding:14px 32px;background:#2563eb;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
                Share my preferences →
              </a>
            </td></tr>
          </table>

          <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.5;">
            Takes about 2 minutes — just pick your dates, budget and what you're after.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            TripAmigos · Group trips, sorted.<br>
            <a href="${inviteUrl}" style="color:#2563eb;text-decoration:none;">View invite in browser</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function reminderEmailHtml({
  organiserName,
  tripName,
  dateFrom,
  dateTo,
  inviteUrl,
}: {
  organiserName: string
  tripName: string
  dateFrom: string
  dateTo: string
  inviteUrl: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f9fb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a1a2e;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fb;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:28px 32px;text-align:center;">
          <span style="font-size:22px;font-weight:600;color:#ffffff;">Trip<span style="opacity:0.9;">Amigos</span></span>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1a2e;">Quick reminder 👋</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
            <strong style="color:#1a1a2e;">${organiserName}</strong> is still waiting for your preferences for <strong style="color:#1a1a2e;">${tripName}</strong> (${dateFrom} – ${dateTo}).
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
            The group can't see their trip options until everyone's submitted — don't be the one holding things up!
          </p>

          <!-- CTA button -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${inviteUrl}" style="display:inline-block;padding:14px 32px;background:#2563eb;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
                Submit my preferences →
              </a>
            </td></tr>
          </table>

          <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
            Only takes 2 minutes.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            TripAmigos · Group trips, sorted.<br>
            <a href="${inviteUrl}" style="color:#2563eb;text-decoration:none;">View invite in browser</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// =====================================================
// SEND FUNCTIONS
// =====================================================

export async function sendInviteEmail({
  to,
  organiserName,
  tripName,
  dateFrom,
  dateTo,
  destinations,
  inviteToken,
}: {
  to: string
  organiserName: string
  tripName: string
  dateFrom: string
  dateTo: string
  destinations: string[]
  inviteToken: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const inviteUrl = `${baseUrl}/invite/${inviteToken}`

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${organiserName} invited you to ${tripName} — share your preferences`,
    html: inviteEmailHtml({
      organiserName,
      tripName,
      dateFrom,
      dateTo,
      destinations,
      inviteUrl,
    }),
  })

  if (error) {
    console.error('Failed to send invite email:', error)
    throw new Error(error.message)
  }

  return data
}

export async function sendReminderEmail({
  to,
  organiserName,
  tripName,
  dateFrom,
  dateTo,
  inviteToken,
}: {
  to: string
  organiserName: string
  tripName: string
  dateFrom: string
  dateTo: string
  inviteToken: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const inviteUrl = `${baseUrl}/invite/${inviteToken}`

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Reminder: ${organiserName} is waiting for your preferences for ${tripName}`,
    html: reminderEmailHtml({
      organiserName,
      tripName,
      dateFrom,
      dateTo,
      inviteUrl,
    }),
  })

  if (error) {
    console.error('Failed to send reminder email:', error)
    throw new Error(error.message)
  }

  return data
}
