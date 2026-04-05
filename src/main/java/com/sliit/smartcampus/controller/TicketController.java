package com.sliit.smartcampus.controller;

import com.sliit.smartcampus.dto.TicketDTO;
import com.sliit.smartcampus.model.enums.Ticketcategory;
import com.sliit.smartcampus.model.enums.Ticketpriority;
import com.sliit.smartcampus.model.enums.Ticketstatus;
import com.sliit.smartcampus.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Ticket")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")  // React dev server
public class TicketController {

    private final TicketService ticketService;

    // ── Create ───────────────────────────────────────────────

    @PostMapping("/create")
    public ResponseEntity<TicketDTO> createTicket(@Valid @RequestBody TicketDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.createTicket(dto));
    }

    // ── Read ─────────────────────────────────────────────────

    @GetMapping("/getAllTickets")
    public ResponseEntity<List<TicketDTO>> getAllTickets() {
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    @GetMapping("/getTicket/{id}")
    public ResponseEntity<TicketDTO> getTicketById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @GetMapping("/byStatus/{status}")
    public ResponseEntity<List<TicketDTO>> getByStatus(@PathVariable Ticketstatus status) {
        return ResponseEntity.ok(ticketService.getByStatus(status));
    }

    @GetMapping("/byPriority/{priority}")
    public ResponseEntity<List<TicketDTO>> getByPriority(@PathVariable Ticketpriority priority) {
        return ResponseEntity.ok(ticketService.getByPriority(priority));
    }

    @GetMapping("/byCategory/{category}")
    public ResponseEntity<List<TicketDTO>> getByCategory(@PathVariable Ticketcategory category) {
        return ResponseEntity.ok(ticketService.getByCategory(category));
    }

    @GetMapping("/byReporter/{reportedBy}")
    public ResponseEntity<List<TicketDTO>> getByReporter(@PathVariable String reportedBy) {
        return ResponseEntity.ok(ticketService.getByReportedBy(reportedBy));
    }

    @GetMapping("/byAssignee/{assignedTo}")
    public ResponseEntity<List<TicketDTO>> getByAssignee(@PathVariable String assignedTo) {
        return ResponseEntity.ok(ticketService.getByAssignedTo(assignedTo));
    }

    // ── Update ───────────────────────────────────────────────

    @PutMapping("/update/{id}")
    public ResponseEntity<TicketDTO> updateTicket(
            @PathVariable Long id,
            @Valid @RequestBody TicketDTO dto) {
        return ResponseEntity.ok(ticketService.updateTicket(id, dto));
    }

    @PatchMapping("/updateStatus/{id}")
    public ResponseEntity<TicketDTO> updateStatus(
            @PathVariable Long id,
            @RequestParam Ticketstatus status) {
        return ResponseEntity.ok(ticketService.updateStatus(id, status));
    }

    // ── Delete ───────────────────────────────────────────────

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteTicket(@PathVariable Long id) {
        ticketService.deleteTicket(id);
        return ResponseEntity.noContent().build();
    }
}