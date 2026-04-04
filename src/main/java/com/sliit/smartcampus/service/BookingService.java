package com.sliit.smartcampus.service;

import com.sliit.smartcampus.dto.BookingDTO;
import com.sliit.smartcampus.model.Booking;
import com.sliit.smartcampus.model.Resource;
import com.sliit.smartcampus.model.User;
import com.sliit.smartcampus.model.enums.BookingStatus;
import com.sliit.smartcampus.repository.BookingRepo;
import com.sliit.smartcampus.repository.ResourceRepo;
import com.sliit.smartcampus.repository.UserRepo;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class BookingService {

    @Autowired
    private BookingRepo bookingRepo;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private ResourceRepo resourceRepo;

    @Autowired
    private ModelMapper modelMapper;

    // ── GET ALL (Admin) ──────────────────────────────────────────────
    public List<BookingDTO> getAllBookings() {
        List<Booking> bookings = bookingRepo.findAll();
        return mapToDTOList(bookings);
    }

    // ── GET BY ID ────────────────────────────────────────────────────
    public BookingDTO getBookingById(Long id) {
        return mapToDTO(findById(id));
    }

    // ── GET BY USER ──────────────────────────────────────────────────
    public List<BookingDTO> getBookingsByUser(Long userId) {
        if (!userRepo.existsById(userId)) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        return mapToDTOList(bookingRepo.findByUserId(userId));
    }

    // ── GET BY STATUS (Admin filter) ─────────────────────────────────
    public List<BookingDTO> getBookingsByStatus(BookingStatus status) {
        return mapToDTOList(bookingRepo.findByStatus(status));
    }

    // ── CREATE ───────────────────────────────────────────────────────
    public BookingDTO addBooking(BookingDTO bookingDTO) {
        User user = userRepo.findById(bookingDTO.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + bookingDTO.getUserId()));

        Resource resource = resourceRepo.findById(bookingDTO.getResourceId())
                .orElseThrow(() -> new RuntimeException("Resource not found with id: " + bookingDTO.getResourceId()));

        // Conflict check
        List<Booking> conflicts = bookingRepo.findConflictingBookings(
                bookingDTO.getResourceId(),
                bookingDTO.getBookingDate(),
                bookingDTO.getStartTime(),
                bookingDTO.getEndTime()
        );
        if (!conflicts.isEmpty()) {
            throw new RuntimeException("This resource is already booked for the selected time slot.");
        }

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setResource(resource);
        booking.setBookingDate(bookingDTO.getBookingDate());
        booking.setStartTime(bookingDTO.getStartTime());
        booking.setEndTime(bookingDTO.getEndTime());
        booking.setPurpose(bookingDTO.getPurpose());
        booking.setExpectedAttendees(bookingDTO.getExpectedAttendees());
        booking.setStatus(BookingStatus.PENDING);

        return mapToDTO(bookingRepo.save(booking));
    }

    // ── APPROVE (Admin) ──────────────────────────────────────────────
    public BookingDTO approveBooking(Long id, String reviewedBy) {
        Booking booking = findById(id);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Only PENDING bookings can be approved.");
        }

        booking.setStatus(BookingStatus.APPROVED);
        booking.setReviewedBy(reviewedBy);
        booking.setReviewedAt(LocalDateTime.now());

        return mapToDTO(bookingRepo.save(booking));
    }

    // ── REJECT (Admin) ───────────────────────────────────────────────
    public BookingDTO rejectBooking(Long id, String reviewedBy, String reason) {
        Booking booking = findById(id);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Only PENDING bookings can be rejected.");
        }
        if (reason == null || reason.isBlank()) {
            throw new RuntimeException("Rejection reason is required.");
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setReviewedBy(reviewedBy);
        booking.setRejectionReason(reason);
        booking.setReviewedAt(LocalDateTime.now());

        return mapToDTO(bookingRepo.save(booking));
    }

    // ── CANCEL ───────────────────────────────────────────────────────
    public BookingDTO cancelBooking(Long id, String reason) {
        Booking booking = findById(id);

        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new RuntimeException("Only APPROVED bookings can be cancelled.");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancellationReason(reason);
        booking.setCancelledAt(LocalDateTime.now());

        return mapToDTO(bookingRepo.save(booking));
    }

    // ── DELETE ───────────────────────────────────────────────────────
    public String deleteBooking(Long id) {
        if (!bookingRepo.existsById(id)) {
            throw new RuntimeException("Booking not found with id: " + id);
        }
        bookingRepo.deleteById(id);
        return "Booking with id " + id + " deleted successfully";
    }

    // ── Helpers ──────────────────────────────────────────────────────
    private Booking findById(Long id) {
        return bookingRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));
    }

    private BookingDTO mapToDTO(Booking booking) {
        BookingDTO dto = new BookingDTO();
        dto.setId(booking.getId());
        dto.setUserId(booking.getUser().getId());
        dto.setUserName(booking.getUser().getName());
        dto.setUserEmail(booking.getUser().getEmail());
        dto.setResourceId(booking.getResource().getId());
        dto.setResourceName(booking.getResource().getName());
        dto.setResourceLocation(booking.getResource().getLocation());
        dto.setBookingDate(booking.getBookingDate());
        dto.setStartTime(booking.getStartTime());
        dto.setEndTime(booking.getEndTime());
        dto.setPurpose(booking.getPurpose());
        dto.setExpectedAttendees(booking.getExpectedAttendees());
        dto.setStatus(booking.getStatus());
        dto.setReviewedBy(booking.getReviewedBy());
        dto.setRejectionReason(booking.getRejectionReason());
        dto.setReviewedAt(booking.getReviewedAt());
        dto.setCancellationReason(booking.getCancellationReason());
        dto.setCancelledAt(booking.getCancelledAt());
        dto.setCreatedAt(booking.getCreatedAt());
        dto.setUpdatedAt(booking.getUpdatedAt());
        return dto;
    }

    private List<BookingDTO> mapToDTOList(List<Booking> bookings) {
        return bookings.stream().map(this::mapToDTO).toList();
    }
}
