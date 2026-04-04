package com.sliit.smartcampus.model.enums;

public enum BookingStatus {
    PENDING,     // Submitted, awaiting admin review
    APPROVED,    // Admin approved
    REJECTED,    // Admin rejected (reason required)
    CANCELLED    // Cancelled after approval
}
