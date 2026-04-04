package com.sliit.smartcampus.controller;

import com.sliit.smartcampus.dto.BookingDTO;
import com.sliit.smartcampus.model.enums.BookingStatus;
import com.sliit.smartcampus.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping(value = "Booking/")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    // GET ALL (Admin)
    @GetMapping("getAllBookings")
    public ResponseEntity<List<BookingDTO>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    // GET BY ID
    @GetMapping("getBooking/{id}")
    public ResponseEntity<BookingDTO> getBookingById(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    // GET BY USER
    @GetMapping("getBookingsByUser/{userId}")
    public ResponseEntity<List<BookingDTO>> getBookingsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(bookingService.getBookingsByUser(userId));
    }

    // GET BY RESOURCE
    // e.g. GET /Booking/getBookingsByResource/5
    @GetMapping("getBookingsByResource/{resourceId}")
    public ResponseEntity<List<BookingDTO>> getBookingsByResource(@PathVariable Long resourceId) {
        return ResponseEntity.ok(bookingService.getBookingsByResource(resourceId));
    }

    // GET BY STATUS (Admin filter)
    // e.g. GET /Booking/getBookingsByStatus?status=PENDING
    @GetMapping("getBookingsByStatus")
    public ResponseEntity<List<BookingDTO>> getBookingsByStatus(
            @RequestParam BookingStatus status) {
        return ResponseEntity.ok(bookingService.getBookingsByStatus(status));
    }

    // CREATE
    @PostMapping("addBooking")
    public ResponseEntity<BookingDTO> addBooking(@RequestBody BookingDTO bookingDTO) {
        return new ResponseEntity<>(bookingService.addBooking(bookingDTO), HttpStatus.CREATED);
    }

    // APPROVE (Admin)
    // e.g. PUT /Booking/approve/3?reviewedBy=admin@sliit.lk
    @PutMapping("approve/{id}")
    public ResponseEntity<BookingDTO> approveBooking(
            @PathVariable Long id,
            @RequestParam String reviewedBy) {
        return ResponseEntity.ok(bookingService.approveBooking(id, reviewedBy));
    }

    // REJECT (Admin)
    // e.g. PUT /Booking/reject/3?reviewedBy=admin@sliit.lk&reason=Clashes with existing event
    @PutMapping("reject/{id}")
    public ResponseEntity<BookingDTO> rejectBooking(
            @PathVariable Long id,
            @RequestParam String reviewedBy,
            @RequestParam String reason) {
        return ResponseEntity.ok(bookingService.rejectBooking(id, reviewedBy, reason));
    }

    // CANCEL
    // e.g. PUT /Booking/cancel/3?reason=No longer needed
    @PutMapping("cancel/{id}")
    public ResponseEntity<BookingDTO> cancelBooking(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(bookingService.cancelBooking(id, reason));
    }

    // DELETE
    @DeleteMapping("deleteBooking/{id}")
    public ResponseEntity<String> deleteBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.deleteBooking(id));
    }
}