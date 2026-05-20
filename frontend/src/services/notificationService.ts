import emailjs from '@emailjs/browser';
import { format } from 'date-fns';
import { EMAILJS_CONFIG, EMAIL_NOTIFICATION_META } from '../config/emailjs/emailjs';
import { Appointment, BookingStatus } from '../types';

type NotificationRecipient = {
  name?: string;
  email?: string;
};

type SlotNotificationContext = {
  appointment: Appointment;
  customer?: NotificationRecipient;
  admin?: NotificationRecipient;
  actorName?: string;
  previousDate?: string;
  previousTime?: string;
};

const { ADMIN_EMAIL, ADMIN_NAME, SHOP_NAME } = EMAIL_NOTIFICATION_META;

const hasEmailConfig = () =>
  Boolean(
    EMAILJS_CONFIG.SERVICE_ID &&
    EMAILJS_CONFIG.TEMPLATE_ID &&
    EMAILJS_CONFIG.PUBLIC_KEY
  );

const formatSlot = (date?: string, time?: string) => {
  if (!date && !time) return 'TBD';
  if (!date) return time || 'TBD';

  try {
    return `${format(new Date(date), 'MMM dd, yyyy')} at ${time || 'TBD'}`;
  } catch {
    return `${date} ${time || ''}`.trim();
  }
};

const buildTemplateParams = ({
  appointment,
  recipient,
  subject,
  headline,
  message,
  actorName,
  previousDate,
  previousTime,
}: {
  appointment: Appointment;
  recipient: NotificationRecipient;
  subject: string;
  headline: string;
  message: string;
  actorName?: string;
  previousDate?: string;
  previousTime?: string;
}) => ({
  to_name: recipient.name || 'Customer',
  to_email: recipient.email || '',
  user_name: recipient.name || 'Customer',
  user_email: recipient.email || '',
  admin_email: ADMIN_EMAIL || '',
  admin_name: ADMIN_NAME,
  customer_name: appointment.notes || recipient.name || 'Customer',
  customer_email: appointment.customerEmail || recipient.email || '',
  service_name: appointment.serviceName || 'Booking',
  booking_id: appointment.id,
  shop_name: SHOP_NAME,
  slot_date: appointment.date,
  slot_time: appointment.time,
  slot_label: formatSlot(appointment.date, appointment.time),
  previous_slot_date: previousDate || '',
  previous_slot_time: previousTime || '',
  previous_slot_label: previousDate || previousTime ? formatSlot(previousDate, previousTime) : '',
  status: appointment.status,
  headline,
  subject,
  message,
  actor_name: actorName || ADMIN_NAME,
  reply_to: recipient.email || ADMIN_EMAIL || '',
});

const sendTemplateEmail = async (
  templateId: string,
  params: Record<string, string>
) => {
  if (!hasEmailConfig()) {
    console.warn('EmailJS is not configured. Skipping email notification.');
    return false;
  }

  await emailjs.send(
    EMAILJS_CONFIG.SERVICE_ID,
    templateId,
    params,
    { publicKey: EMAILJS_CONFIG.PUBLIC_KEY }
  );

  return true;
};

export async function notifyAdminNewBooking(context: SlotNotificationContext) {
  if (!ADMIN_EMAIL) return false;

  const { appointment, customer } = context;
  return sendTemplateEmail(
    EMAILJS_CONFIG.QUICK_TEMPLATE_ID || EMAILJS_CONFIG.TEMPLATE_ID,
    buildTemplateParams({
      appointment,
      recipient: { name: ADMIN_NAME, email: ADMIN_EMAIL },
      subject: `New booking request for ${appointment.serviceName || 'service'}`,
      headline: 'New booking request received',
      message: `${appointment.notes || customer?.name || 'A customer'} booked ${appointment.serviceName || 'a service'} for ${formatSlot(appointment.date, appointment.time)} and is waiting for approval.`,
      actorName: customer?.name,
    })
  );
}

export async function notifyCustomerBookingSubmitted(context: SlotNotificationContext) {
  const { appointment, customer } = context;
  if (!customer?.email) return false;

  return sendTemplateEmail(
    EMAILJS_CONFIG.TEMPLATE_ID,
    buildTemplateParams({
      appointment,
      recipient: customer,
      subject: 'Your booking request was received',
      headline: 'Booking request submitted',
      message: `Your request for ${appointment.serviceName || 'a service'} on ${formatSlot(appointment.date, appointment.time)} has been sent to the admin for approval.`,
    })
  );
}

export async function notifyCustomerStatusUpdate(
  context: SlotNotificationContext,
  status: BookingStatus
) {
  const { appointment, customer, actorName } = context;
  if (!customer?.email) return false;

  const isConfirmed = status === BookingStatus.CONFIRMED;
  return sendTemplateEmail(
    EMAILJS_CONFIG.TEMPLATE_ID,
    buildTemplateParams({
      appointment: { ...appointment, status },
      recipient: customer,
      subject: isConfirmed ? 'Your slot has been approved' : 'Your booking request was updated',
      headline: isConfirmed ? 'Booking approved' : 'Booking update',
      message: isConfirmed
        ? `Your ${appointment.serviceName || 'booking'} for ${formatSlot(appointment.date, appointment.time)} has been approved by admin.`
        : `Your ${appointment.serviceName || 'booking'} request for ${formatSlot(appointment.date, appointment.time)} was marked as ${status}.`,
      actorName,
    })
  );
}

export async function notifyAdminSlotChangeRequest(context: SlotNotificationContext) {
  if (!ADMIN_EMAIL) return false;

  const { appointment, customer, previousDate, previousTime } = context;
  return sendTemplateEmail(
    EMAILJS_CONFIG.QUICK_TEMPLATE_ID || EMAILJS_CONFIG.TEMPLATE_ID,
    buildTemplateParams({
      appointment,
      recipient: { name: ADMIN_NAME, email: ADMIN_EMAIL },
      subject: 'Customer requested a slot change',
      headline: 'Slot change request received',
      message: `${appointment.notes || customer?.name || 'A customer'} requested a slot change from ${formatSlot(previousDate, previousTime)} to ${formatSlot(appointment.date, appointment.time)}.`,
      previousDate,
      previousTime,
      actorName: customer?.name,
    })
  );
}

export async function notifyCustomerSlotChanged(context: SlotNotificationContext) {
  const { appointment, customer, actorName, previousDate, previousTime } = context;
  if (!customer?.email) return false;

  return sendTemplateEmail(
    EMAILJS_CONFIG.TEMPLATE_ID,
    buildTemplateParams({
      appointment,
      recipient: customer,
      subject: 'Your booking slot was updated',
      headline: 'Slot updated',
      message: `Your ${appointment.serviceName || 'booking'} slot was changed from ${formatSlot(previousDate, previousTime)} to ${formatSlot(appointment.date, appointment.time)}. The latest status is ${appointment.status}.`,
      actorName,
      previousDate,
      previousTime,
    })
  );
}
