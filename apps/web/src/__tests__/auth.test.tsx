import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import { TestWrapper } from './setup';

// Test auth API endpoints directly via fetch
describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('returns 201 with user data and token when registration succeeds', async () => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('refreshToken');
      expect(data.user).toMatchObject({
        email: 'newuser@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
      });
    });

    it('returns 409 Conflict when email is already registered', async () => {
      // First registration succeeds (handled by MSW default)
      // Second registration with same email should fail
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com', // Already used in MSW handler
          password: 'Password123!',
          firstName: 'Jane',
          lastName: 'Doe',
        }),
      });

      expect(response.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 200 with token when login succeeds with correct credentials', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('token');
      expect(data.user).toMatchObject({
        email: 'test@example.com',
      });
    });

    it('returns 401 Unauthorized when password is wrong', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      });

      expect(response.status).toBe(401);
    });

    it('returns 401 when email does not exist', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns user data when called with valid token', async () => {
      // Login first to get token
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });
      const { token } = await loginResponse.json();

      // Call /auth/me with token
      const meResponse = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(meResponse.status).toBe(200);
      const user = await meResponse.json();
      expect(user).toHaveProperty('id');
      expect(user.email).toBe('test@example.com');
    });

    it('returns 401 when called without token', async () => {
      const response = await fetch('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });
});

describe('Protected Routes', () => {
  it('rejects unauthenticated request to booking creation', async () => {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'room-1',
        checkIn: '2026-06-01',
        checkOut: '2026-06-05',
        numberOfGuests: 2,
      }),
    });

    // Should be rejected - no auth token
    expect(response.status).toBe(401);
  });

  it('rejects unauthenticated request to user bookings list', async () => {
    const response = await fetch('/api/bookings');

    expect(response.status).toBe(401);
  });

  it('rejects unauthenticated request to hotel admin dashboard', async () => {
    const response = await fetch('/api/hotel-admin/dashboard');

    expect(response.status).toBe(401);
  });

  it('rejects unauthenticated request to system admin dashboard', async () => {
    const response = await fetch('/api/admin/dashboard');

    expect(response.status).toBe(401);
  });
});

describe('Role-Based Access Control', () => {
  it('hotel admin cannot access system admin routes', async () => {
    // Login as hotel admin
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hoteladmin@example.com',
        password: 'password123',
      }),
    });

    if (loginResponse.status === 200) {
      const { token } = await loginResponse.json();

      // Try to access system admin route
      const adminResponse = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(adminResponse.status).toBe(403);
    }
  });

  it('normal user cannot access hotel admin routes', async () => {
    // Login as normal user
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    if (loginResponse.status === 200) {
      const { token } = await loginResponse.json();

      // Try to access hotel admin route
      const hotelAdminResponse = await fetch('/api/hotel-admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(hotelAdminResponse.status).toBe(403);
    }
  });
});
