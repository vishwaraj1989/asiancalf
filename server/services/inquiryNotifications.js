const https = require('https');

const requestJson = (options, body) => new Promise((resolve, reject) => {
  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', (chunk) => { data += chunk; });
    response.on('end', () => {
      if (response.statusCode >= 200 && response.statusCode < 300) return resolve(data);
      reject(new Error(`Notification provider returned ${response.statusCode}: ${data}`));
    });
  });
  request.on('error', reject);
  request.write(JSON.stringify(body));
  request.end();
});

const textFor = (inquiry) => [
  'New AsianCalf inquiry',
  `Name: ${inquiry.name}`,
  `Email: ${inquiry.email || 'not provided'}`,
  `Phone: ${inquiry.phone}`,
  inquiry.productName ? `Product: ${inquiry.productName}` : null,
  `Message: ${inquiry.message}`,
].filter(Boolean).join('\n');

async function sendEmail(inquiry) {
  const { RESEND_API_KEY, INQUIRY_FROM_EMAIL, INQUIRY_TO_EMAIL } = process.env;
  if (!RESEND_API_KEY || !INQUIRY_FROM_EMAIL || !INQUIRY_TO_EMAIL) return false;
  await requestJson({ hostname: 'api.resend.com', path: '/emails', method: 'POST', headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' } }, { from: INQUIRY_FROM_EMAIL, to: [INQUIRY_TO_EMAIL], subject: `New inquiry from ${inquiry.name}`, text: textFor(inquiry) });
  return true;
}

async function sendWhatsApp(inquiry) {
  const { WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_RECIPIENT_PHONE } = process.env;
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_RECIPIENT_PHONE) return false;
  await requestJson({ hostname: 'graph.facebook.com', path: `/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, method: 'POST', headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' } }, { messaging_product: 'whatsapp', to: WHATSAPP_RECIPIENT_PHONE, type: 'text', text: { preview_url: false, body: textFor(inquiry) } });
  return true;
}

exports.notifyInquiry = async (inquiry) => {
  const results = await Promise.allSettled([sendEmail(inquiry), sendWhatsApp(inquiry)]);
  results.filter((result) => result.status === 'rejected').forEach((result) => console.error('Inquiry notification failed:', result.reason.message));
};
