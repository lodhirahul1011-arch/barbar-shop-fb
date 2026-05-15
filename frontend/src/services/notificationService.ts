export async function sendBookingNotification(type: string, payload: any) {
  console.log('Notification Event:', type, payload);

  return {
    success: true,
    timestamp: Date.now(),
  };
}