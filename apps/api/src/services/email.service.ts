import { logger } from '../utils/logger';
import type { Booking, Room, Hotel, Payment } from '../../generated/prisma';

interface EmailParams {
  to: string;
  subject: string;
  body: string;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function sendBookingConfirmationEmail(booking: Booking & { room: Room & { hotel: Hotel } }): void {
  const email: EmailParams = {
    to: 'customer@example.com', // Would fetch user's email
    subject: `Booking Confirmed - ${booking.room.hotel.name}`,
    body: `
========================================
BOOKING CONFIRMATION EMAIL
========================================
Booking ID: ${booking.id}
Hotel: ${booking.room.hotel.name}
Address: ${booking.room.hotel.address}, ${booking.room.hotel.city}

Check-in:  ${formatDate(booking.checkIn)}
Check-out: ${formatDate(booking.checkOut)}
Guests:     ${booking.numberOfGuests}
Room Type:  ${booking.room.type}

Total Price: ${formatPrice(Number(booking.totalPrice))}

Status: ${booking.status}

Special Requests: ${booking.specialRequests || 'None'}

Thank you for your booking!
========================================
    `.trim(),
  };

  logger.info(`[EMAIL SENT] Confirmation\n${email.body}`);
  console.log(`\n[EMAIL] To: ${email.to}\nSubject: ${email.subject}\n${email.body}\n`);
}

export function sendBookingCancellationEmail(
  booking: Booking & { room: Room & { hotel: Hotel } },
  refundAmount: number,
  refundPolicy: string,
): void {
  const email: EmailParams = {
    to: 'customer@example.com',
    subject: `Booking Cancelled - ${booking.room.hotel.name}`,
    body: `
========================================
BOOKING CANCELLATION EMAIL
========================================
Booking ID: ${booking.id}
Hotel: ${booking.room.hotel.name}

Check-in:  ${formatDate(booking.checkIn)}
Check-out: ${formatDate(booking.checkOut)}

Cancellation Policy Applied: ${refundPolicy}
Refund Amount: ${formatPrice(refundAmount)}

Your booking has been cancelled.
========================================
    `.trim(),
  };

  logger.info(`[EMAIL SENT] Cancellation\n${email.body}`);
  console.log(`\n[EMAIL] To: ${email.to}\nSubject: ${email.subject}\n${email.body}\n`);
}

export function sendCheckInReminderEmail(booking: Booking & { room: Room & { hotel: Hotel } }): void {
  const email: EmailParams = {
    to: 'customer@example.com',
    subject: `Check-in Reminder - ${booking.room.hotel.name}`,
    body: `
========================================
CHECK-IN REMINDER EMAIL
========================================
Booking ID: ${booking.id}
Hotel: ${booking.room.hotel.name}
Address: ${booking.room.hotel.address}, ${booking.room.hotel.city}

Your check-in is tomorrow!
Check-in:  ${formatDate(booking.checkIn)}
Check-out: ${formatDate(booking.checkOut)}

Please arrive at the hotel reception.
Room Type: ${booking.room.type}

We look forward to hosting you!
========================================
    `.trim(),
  };

  logger.info(`[EMAIL SENT] Reminder\n${email.body}`);
  console.log(`\n[EMAIL] To: ${email.to}\nSubject: ${email.subject}\n${email.body}\n`);
}

export function sendPaymentConfirmationEmail(payment: Payment, booking: Booking): void {
  const email: EmailParams = {
    to: 'customer@example.com',
    subject: `Payment Received - Booking ${booking.id}`,
    body: `
========================================
PAYMENT CONFIRMATION EMAIL
========================================
Payment ID: ${payment.id}
Booking ID: ${booking.id}

Amount:  ${formatPrice(Number(payment.amount))}
Method:  ${payment.paymentMethod}
Status:  ${payment.status}
Transaction ID: ${payment.transactionId || 'N/A'}

Thank you for your payment!
========================================
    `.trim(),
  };

  logger.info(`[EMAIL SENT] Payment\n${email.body}`);
  console.log(`\n[EMAIL] To: ${email.to}\nSubject: ${email.subject}\n${email.body}\n`);
}

export function sendRefundConfirmationEmail(payment: Payment, booking: Booking, refundAmount: number): void {
  const email: EmailParams = {
    to: 'customer@example.com',
    subject: `Refund Processed - Booking ${booking.id}`,
    body: `
========================================
REFUND CONFIRMATION EMAIL
========================================
Payment ID: ${payment.id}
Booking ID: ${booking.id}

Original Amount: ${formatPrice(Number(payment.amount))}
Refund Amount:   ${formatPrice(refundAmount)}
Status:          ${payment.status}

Your refund has been processed.
========================================
    `.trim(),
  };

  logger.info(`[EMAIL SENT] Refund\n${email.body}`);
  console.log(`\n[EMAIL] To: ${email.to}\nSubject: ${email.subject}\n${email.body}\n`);
}
