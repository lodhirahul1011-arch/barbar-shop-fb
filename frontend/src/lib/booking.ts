import { addMinutes, format, isAfter, isBefore, parse, startOfDay, addDays } from 'date-fns';
import { Appointment, ShopSettings, BookingStatus } from '../types';

export function isSlotAvailable(
  date: string,
  time: string,
  duration: number,
  existingAppointments: Appointment[],
  settings: ShopSettings
): boolean {
  const dayName = format(parse(date, 'yyyy-MM-dd', new Date()), 'EEE').toLowerCase();
  const daySettings = settings.workingHours[dayName];
  
  if (!daySettings || daySettings.isClosed) return false;
  if (settings.blockedDates?.includes(date)) return false;

  const slotStart = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
  const slotEnd = addMinutes(slotStart, duration);

  const openTime = parse(`${date} ${daySettings.open}`, 'yyyy-MM-dd HH:mm', new Date());
  const closeTime = parse(`${date} ${daySettings.close}`, 'yyyy-MM-dd HH:mm', new Date());

  // Check working hours
  if (isBefore(slotStart, openTime) || isAfter(slotEnd, closeTime)) return false;

  // Check breaks
  for (const breakTime of settings.breakTimes ?? []) {
    const bStart = parse(`${date} ${breakTime.start}`, 'yyyy-MM-dd HH:mm', new Date());
    const bEnd = parse(`${date} ${breakTime.end}`, 'yyyy-MM-dd HH:mm', new Date());
    
    // Overlap check
    if (isBefore(slotStart, bEnd) && isAfter(slotEnd, bStart)) return false;
  }

  // Check existing appointments (excluding cancelled/rejected)
  const activeAppointments = existingAppointments.filter(app => 
    app.date === date && 
    app.status !== BookingStatus.CANCELLED && 
    app.status !== BookingStatus.REJECTED
  );

  for (const app of activeAppointments) {
    const appStart = parse(`${date} ${app.time}`, 'yyyy-MM-dd HH:mm', new Date());
    // Use the stored duration if available, else fallback to slotDuration
    const appDuration = app.serviceDuration || settings.slotDuration;
    const appEnd = addMinutes(appStart, appDuration); 

    if (isBefore(slotStart, appEnd) && isAfter(slotEnd, appStart)) return false;
  }

  return true;
}

export function findNextAvailableSlot(
  startDate: string,
  startTime: string,
  duration: number,
  existingAppointments: Appointment[],
  settings: ShopSettings
): { date: string; time: string } | null {
  let currentDate = parse(startDate, 'yyyy-MM-dd', new Date());
  let iterations = 0;
  const maxDays = 7; // Look ahead 1 week

  while (iterations < maxDays) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayName = format(currentDate, 'EEE').toLowerCase();
    const daySettings = settings.workingHours[dayName];

    if (daySettings && !daySettings.isClosed) {
      let currentTime = parse(`${dateStr} ${daySettings.open}`, 'yyyy-MM-dd HH:mm', new Date());
      const closeTime = parse(`${dateStr} ${daySettings.close}`, 'yyyy-MM-dd HH:mm', new Date());

      // If it's the same day as requested, start after the requested time
      if (dateStr === startDate) {
        const requestedTime = parse(`${dateStr} ${startTime}`, 'yyyy-MM-dd HH:mm', new Date());
        currentTime = isAfter(requestedTime, currentTime) ? requestedTime : currentTime;
      }

      while (isBefore(addMinutes(currentTime, duration), closeTime)) {
        const timeStr = format(currentTime, 'HH:mm');
        if (isSlotAvailable(dateStr, timeStr, duration, existingAppointments, settings)) {
          return { date: dateStr, time: timeStr };
        }
        currentTime = addMinutes(currentTime, settings.slotDuration);
      }
    }

    currentDate = addDays(currentDate, 1);
    iterations++;
  }

  return null;
}
