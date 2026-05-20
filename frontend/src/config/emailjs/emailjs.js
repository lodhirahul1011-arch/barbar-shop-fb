export const EMAILJS_CONFIG = {
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  QUICK_TEMPLATE_ID:
    import.meta.env.VITE_EMAILJS_QUICK_TEMPLATE_ID ||
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
};

export const EMAIL_NOTIFICATION_META = {
  ADMIN_EMAIL:
    import.meta.env.VITE_ADMIN_EMAIL || import.meta.env.VITE_CONTACT_EMAIL,
  ADMIN_NAME: import.meta.env.VITE_ADMIN_NAME || 'BarberFlow Admin',
  SHOP_NAME: import.meta.env.VITE_SHOP_NAME || 'BarberFlow',
};
