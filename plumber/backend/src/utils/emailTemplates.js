/**
 * Reusable HTML Email Template Generator for FlowMatch
 * Focuses on table-based layouts for cross-client compatibility (Outlook, Gmail, etc.)
 */

const colors = {
  navy: '#0A2540',
  blue: '#2E86C1',
  amber: '#F59E0B',
  green: '#1A7A4A',
  red: '#DC2626',
  surface: '#F5F7FA',
  white: '#FFFFFF',
  muted: '#64748B',
  border: '#E2E8F0',
};

const generateEmailTemplate = ({ title, message, status, details = {} }) => {
  const statusColors = {
    accepted: colors.green,
    completed: colors.blue,
    cancelled: colors.red,
    declined: colors.red,
    pending: colors.amber,
  };

  const statusColor = statusColors[status?.toLowerCase()] || colors.navy;

  const detailRows = Object.entries(details)
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding-bottom: 12px;">
          <div style="font-size: 13px; color: ${colors.muted}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">${label}</div>
          <div style="font-size: 15px; color: ${colors.navy}; font-weight: 600;">${value}</div>
        </td>
      </tr>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${colors.surface}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.surface};">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <!-- Main Container -->
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%;">
              
              <!-- Header with Gradient Fallback -->
              <tr>
                <td style="background-color: ${colors.navy}; background: linear-gradient(135deg, ${colors.navy} 0%, #1a365d 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
                  <div style="font-size: 24px; font-weight: 800; color: ${colors.white}; letter-spacing: -0.02em;">FlowMatch</div>
                  <div style="font-size: 14px; color: rgba(255,255,255,0.7); margin-top: 4px;">Connecting you with trusted professionals</div>
                </td>
              </tr>

              <!-- Content Card -->
              <tr>
                <td style="background-color: ${colors.white}; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid ${colors.border}; border-top: none;">
                  
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding-bottom: 24px;">
                        <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: ${colors.navy};">${title}</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 24px;">
                        <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #334155;">${message}</p>
                      </td>
                    </tr>

                    <!-- Status Badge -->
                    ${status ? `
                    <tr>
                      <td style="padding-bottom: 32px;">
                        <span style="display: inline-block; background-color: ${statusColor}15; color: ${statusColor}; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; text-transform: uppercase; border: 1px solid ${statusColor}30;">
                          ${status}
                        </span>
                      </td>
                    </tr>
                    ` : ''}

                    <!-- Details Section -->
                    ${detailRows ? `
                    <tr>
                      <td style="padding: 24px; background-color: ${colors.surface}; border-radius: 8px;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                          ${detailRows}
                        </table>
                      </td>
                    </tr>
                    ` : ''}

                    <tr>
                      <td style="padding-top: 40px; text-align: center; border-top: 1px solid ${colors.border};">
                        <p style="margin: 0; font-size: 14px; color: ${colors.muted};">
                          Thank you for choosing FlowMatch.
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: ${colors.muted};">
                    &copy; ${new Date().getFullYear()} FlowMatch. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

module.exports = { generateEmailTemplate };
