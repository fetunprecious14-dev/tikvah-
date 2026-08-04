import type { SendEmailInput } from './sendEmail';

function wrap(preheader: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4efe4;font-family:'DM Sans',Helvetica,Arial,sans-serif;color:#233a2c;">
    <span style="display:none;">${preheader}</span>
    <div style="max-width:480px;margin:0 auto;padding:40px 24px;">
      <p style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#4f7a5b;margin:0 0 24px;">Tikvah</p>
      ${bodyHtml}
      <p style="margin-top:40px;font-size:12px;line-height:1.6;color:#7a8a7e;">
        You're receiving this because you have an account at Tikvah. Every message you send us is read only by our team.
      </p>
    </div>
  </body>
</html>`;
}

export function verificationEmail(params: { to: string; name: string; verifyUrl: string }): SendEmailInput {
  return {
    to: params.to,
    subject: 'Confirm your email for Tikvah',
    text: `Hi ${params.name},\n\nPlease confirm your email address to finish setting up your Tikvah account:\n${params.verifyUrl}\n\nIf you didn't create this account, you can safely ignore this email.\n\n— The Tikvah team`,
    html: wrap(
      'Confirm your email to finish setting up your Tikvah account.',
      `<h1 style="font-size:24px;font-weight:600;margin:0 0 16px;">Hi ${params.name}, welcome.</h1>
       <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">Please confirm your email address to finish setting up your account. This helps us make sure a reply can always find its way back to you.</p>
       <a href="${params.verifyUrl}" style="display:inline-block;background:#3b5b46;color:#f4efe4;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;">Confirm my email</a>
       <p style="font-size:13px;line-height:1.6;color:#7a8a7e;margin-top:24px;">If the button doesn't work, copy and paste this link: ${params.verifyUrl}</p>`,
    ),
  };
}

export function replyNotificationEmail(params: { to: string; name: string; conversationUrl: string }): SendEmailInput {
  return {
    to: params.to,
    subject: 'Someone from Tikvah has written back to you',
    text: `Hi ${params.name},\n\nA member of the Tikvah team has replied to what you shared. You can read it here:\n${params.conversationUrl}\n\n— The Tikvah team`,
    html: wrap(
      'A member of the Tikvah team has replied to what you shared.',
      `<h1 style="font-size:24px;font-weight:600;margin:0 0 16px;">You have a reply.</h1>
       <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">A member of our team took the time to read what you shared and wrote back. Whenever you're ready:</p>
       <a href="${params.conversationUrl}" style="display:inline-block;background:#3b5b46;color:#f4efe4;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;">Read the reply</a>`,
    ),
  };
}

export function urgentAlertEmail(params: { to: string; userName: string; categories: string[]; conversationUrl: string }): SendEmailInput {
  return {
    to: params.to,
    subject: `Urgent: a submission from ${params.userName} needs review`,
    text: `A new or updated conversation from ${params.userName} was flagged as urgent.\n\nPossible concerns: ${params.categories.join(', ')}\n\nReview it now: ${params.conversationUrl}`,
    html: wrap(
      `A submission from ${params.userName} needs urgent review.`,
      `<h1 style="font-size:24px;font-weight:600;margin:0 0 16px;color:#7a3b2e;">Urgent review needed</h1>
       <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">A conversation from <strong>${params.userName}</strong> was automatically flagged.</p>
       <p style="font-size:13px;line-height:1.6;margin:0 0 24px;color:#7a8a7e;">Possible concerns: ${params.categories.join(', ')}</p>
       <a href="${params.conversationUrl}" style="display:inline-block;background:#7a3b2e;color:#f4efe4;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;">Review now</a>`,
    ),
  };
}
