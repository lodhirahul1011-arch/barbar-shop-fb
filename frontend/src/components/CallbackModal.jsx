import React, { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../config/emailjs/emailjs';

export default function CallbackModal({ open, onClose }) {
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formRef.current) return;

    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      await emailjs.sendForm(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.QUICK_TEMPLATE_ID || EMAILJS_CONFIG.TEMPLATE_ID,
        formRef.current,
        { publicKey: EMAILJS_CONFIG.PUBLIC_KEY }
      );

      setSuccess(true);
      formRef.current.reset();
    } catch (err) {
      console.error(err);
      setError('Could not send email');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Request Callback</h2>
          <button type="button" onClick={onClose} className="text-sm font-semibold text-slate-500">
            X
          </button>
        </div>

        {success && <div className="mb-3 text-green-600">Message sent successfully</div>}
        {error && <div className="mb-3 text-red-600">{error}</div>}

        <form ref={formRef} onSubmit={handleSubmit}>
          <input
            name="user_name"
            placeholder="Your Name"
            className="mb-3 w-full border p-2"
            required
          />

          <input
            name="user_phone"
            placeholder="Phone Number"
            className="mb-3 w-full border p-2"
            required
          />

          <input
            name="user_email"
            type="email"
            placeholder="Email Address"
            className="mb-3 w-full border p-2"
            required
          />

          <input
            name="callback_time"
            placeholder="Preferred Time"
            className="mb-3 w-full border p-2"
          />

          <select name="enquiry_type" className="mb-3 w-full border p-2" defaultValue="Booking Help">
            <option value="Booking Help">Booking Help</option>
            <option value="Slot Change">Slot Change</option>
            <option value="General Enquiry">General Enquiry</option>
          </select>

          <textarea
            name="message"
            placeholder="Tell us what you need"
            className="mb-4 min-h-28 w-full border p-2"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
