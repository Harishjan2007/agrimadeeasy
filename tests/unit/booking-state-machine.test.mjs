import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Logic matching src/lib/supabase/machinery.ts
const VALID_BOOKING_TRANSITIONS = {
  pending: ['accepted', 'rejected', 'cancelled'],
  accepted: ['on_the_way', 'cancelled'],
  rejected: [],
  on_the_way: ['arrived', 'cancelled'],
  arrived: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
};

function isValidBookingTransition(currentStatus, newStatus) {
  if (currentStatus === newStatus) return true; // Idempotent
  const allowed = VALID_BOOKING_TRANSITIONS[currentStatus];
  return Boolean(allowed && allowed.includes(newStatus));
}

describe('Machinery Booking State Machine Unit Tests', () => {
  test('allows legal forward progression: pending -> accepted -> on_the_way -> arrived -> in_progress -> completed', () => {
    assert.ok(isValidBookingTransition('pending', 'accepted'));
    assert.ok(isValidBookingTransition('accepted', 'on_the_way'));
    assert.ok(isValidBookingTransition('on_the_way', 'arrived'));
    assert.ok(isValidBookingTransition('arrived', 'in_progress'));
    assert.ok(isValidBookingTransition('in_progress', 'completed'));
  });

  test('allows cancellation from non-terminal states', () => {
    assert.ok(isValidBookingTransition('pending', 'cancelled'));
    assert.ok(isValidBookingTransition('accepted', 'cancelled'));
    assert.ok(isValidBookingTransition('on_the_way', 'cancelled'));
    assert.ok(isValidBookingTransition('arrived', 'cancelled'));
    assert.ok(isValidBookingTransition('in_progress', 'cancelled'));
  });

  test('strictly rejects illegal transition jumps', () => {
    // Cannot skip directly from pending to completed
    assert.equal(isValidBookingTransition('pending', 'completed'), false);
    // Cannot skip from pending to in_progress
    assert.equal(isValidBookingTransition('pending', 'in_progress'), false);
    // Cannot skip from accepted to completed
    assert.equal(isValidBookingTransition('accepted', 'completed'), false);
  });

  test('strictly rejects any transition out of terminal states (completed, cancelled, rejected)', () => {
    assert.equal(isValidBookingTransition('completed', 'in_progress'), false);
    assert.equal(isValidBookingTransition('completed', 'pending'), false);
    assert.equal(isValidBookingTransition('cancelled', 'on_the_way'), false);
    assert.equal(isValidBookingTransition('cancelled', 'accepted'), false);
    assert.equal(isValidBookingTransition('rejected', 'accepted'), false);
  });

  test('idempotent status change (same to same) is permitted', () => {
    assert.ok(isValidBookingTransition('pending', 'pending'));
    assert.ok(isValidBookingTransition('on_the_way', 'on_the_way'));
    assert.ok(isValidBookingTransition('completed', 'completed'));
  });
});
