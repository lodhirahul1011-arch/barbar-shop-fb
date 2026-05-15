import { addMinutes, differenceInMinutes, parse } from 'date-fns';

export const MINIMUM_BOOKING_NOTICE_MINUTES = 60;
export const MAX_ADVANCE_BOOKING_DAYS = 30;

export function validateLeadTime(date: string, time: string) {
  const bookingTime = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
  const now = new Date();

  const diff = differenceInMinutes(bookingTime, now);

  return diff >= MINIMUM_BOOKING_NOTICE_MINUTES;
}

export function buildSlotLockId(
  shopId: string,
  barberId: string,
  date: string,
  time: string
) {
  return `${shopId}_${barberId}_${date}_${time}`;
}

export function withBuffer(
  time: Date,
  duration: number,
  bufferMinutes: number
) {
  return addMinutes(time, duration + bufferMinutes);
}