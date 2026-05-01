import { prisma } from '../utils/db';
import { ApiError } from '../utils/ApiError';
import type { PaymentMethod, PaymentStatus } from '../../generated/prisma';
import { sendPaymentConfirmationEmail, sendRefundConfirmationEmail } from './email.service';

export interface ProcessPaymentData {
  bookingId: string;
  paymentMethod: PaymentMethod;
  cardToken: string;
  idempotencyKey?: string;
}

export interface PaymentDetail {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId: string | null;
  paidAt: Date | null;
  createdAt: Date;
  booking: {
    id: string;
    checkIn: Date;
    checkOut: Date;
    totalPrice: number;
    status: string;
    room: {
      id: string;
      type: string;
      hotel: {
        id: string;
        name: string;
      };
    };
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePayment(payment: any): PaymentDetail {
  return {
    ...payment,
    amount: Number(payment.amount),
    booking: {
      ...payment.booking,
      totalPrice: Number(payment.booking.totalPrice),
    },
  };
}

function generateTransactionId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

function simulatePaymentGateway(_cardToken: string): { success: boolean; gatewayTransactionId: string } {
  // Mock gateway: 80% success rate
  const success = Math.random() > 0.2;
  const gatewayTransactionId = success ? `GW-${generateTransactionId()}` : `GW-FAILED-${Date.now()}`;
  return { success, gatewayTransactionId };
}

export async function processPayment(data: ProcessPaymentData): Promise<PaymentDetail> {
  const { bookingId, paymentMethod, cardToken, idempotencyKey } = data;

  // Idempotency check: if same idempotency key was used, return existing payment
  if (idempotencyKey) {
    const existingPayment = await prisma.payment.findFirst({
      where: {
        bookingId,
        paymentMethod,
        transactionId: { startsWith: 'GW-' },
      },
      include: { booking: { include: { room: { include: { hotel: true } } } } },
    });

    if (existingPayment) {
      return normalizePayment(existingPayment);
    }
  }

  // 1. Find PENDING booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { room: { include: { hotel: true } } },
  });

  if (!booking) {
    throw new ApiError('Booking not found', 404, 'NOT_FOUND');
  }

  if (booking.status !== 'PENDING') {
    throw new ApiError(`Cannot process payment for booking with status: ${booking.status}`, 400, 'INVALID_BOOKING_STATUS');
  }

  // 2. Check if already paid
  const existingPaid = await prisma.payment.findFirst({
    where: { bookingId, status: 'PAID' },
  });

  if (existingPaid) {
    throw new ApiError('Booking is already paid', 400, 'ALREADY_PAID');
  }

  // 3. Simulate mock payment gateway
  const { success, gatewayTransactionId } = simulatePaymentGateway(cardToken);

  // 4. Atomic transaction: create payment + update booking status
  return prisma.$transaction(async (tx) => {
    if (success) {
      const payment = await tx.payment.create({
        data: {
          bookingId,
          amount: booking.totalPrice,
          currency: 'USD',
          paymentMethod,
          status: 'PAID',
          transactionId: gatewayTransactionId,
          paidAt: new Date(),
        },
        include: { booking: { include: { room: { include: { hotel: true } } } } },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' },
      });

      sendPaymentConfirmationEmail(payment, booking);

      return normalizePayment(payment);
    } else {
      const payment = await tx.payment.create({
        data: {
          bookingId,
          amount: booking.totalPrice,
          currency: 'USD',
          paymentMethod,
          status: 'FAILED',
          transactionId: gatewayTransactionId,
        },
        include: { booking: { include: { room: { include: { hotel: true } } } } },
      });

      // Keep booking PENDING for retry
      return normalizePayment(payment);
    }
  });
}

export async function refundPayment(paymentId: string, _adminId?: string): Promise<PaymentDetail> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { booking: { include: { room: { include: { hotel: true } } } } },
  });

  if (!payment) {
    throw new ApiError('Payment not found', 404, 'NOT_FOUND');
  }

  if (payment.status !== 'PAID') {
    throw new ApiError('Can only refund PAID payments', 400, 'INVALID_PAYMENT_STATUS');
  }

  const refundAmount = Number(payment.amount);

  const updated = await prisma.$transaction(async (tx) => {
    const refunded = await tx.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED' },
      include: { booking: { include: { room: { include: { hotel: true } } } } },
    });

    // Update booking to CANCELLED if this was the only payment
    const otherPayments = await tx.payment.findMany({
      where: {
        bookingId: payment.bookingId,
        id: { not: paymentId },
        status: 'PAID',
      },
    });

    if (otherPayments.length === 0) {
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CANCELLED' },
      });
    }

    return refunded;
  });

  sendRefundConfirmationEmail(updated, payment.booking, refundAmount);

  return normalizePayment(updated);
}

export async function getPaymentsByBooking(bookingId: string): Promise<PaymentDetail[]> {
  const payments = await prisma.payment.findMany({
    where: { bookingId },
    orderBy: { createdAt: 'desc' },
    include: { booking: { include: { room: { include: { hotel: true } } } } },
  });

  return payments.map(normalizePayment);
}
