import axios from 'axios';

const WHATSAPP_TOKEN = process.env.WHATSAPP_API_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

export async function sendWhatsAppMessage(to: string, templateName: string, components: any[]) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.warn('WhatsApp credentials missing. Skipping notification.');
    return;
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en_US' },
          components
        }
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (err: any) {
    console.error('WhatsApp API Error:', err.response?.data || err.message);
    throw err;
  }
}

type SimpleWhatsAppMessage =
  | string
  | {
      to: string;
      message: string;
    };

export async function sendSimpleWhatsAppMessage(input: SimpleWhatsAppMessage, message?: string) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) return;

  const to = typeof input === 'string' ? input : input.to;
  const body = typeof input === 'string' ? message : input.message;
  if (!to || !body) return;

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body }
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (err: any) {
    console.error('WhatsApp Text API Error:', err.response?.data || err.message);
    throw err;
  }
}
