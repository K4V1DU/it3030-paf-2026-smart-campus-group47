package com.sliit.smartcampus.service;

import com.sliit.smartcampus.dto.TicketDTO;
import com.sliit.smartcampus.model.Ticket;
import com.sliit.smartcampus.model.enums.Ticketcategory;
import com.sliit.smartcampus.model.enums.Ticketpriority;
import com.sliit.smartcampus.model.enums.Ticketstatus;
import com.sliit.smartcampus.repository.TicketRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;

    // ── Helpers ─────────────────────────────────────────────

    private Ticket toEntity(TicketDTO dto) {
        Ticket ticket = new Ticket();
        ticket.setTitle(dto.getTitle());
        ticket.setDescription(dto.getDescription());
        ticket.setCategory(dto.getCategory());
        ticket.setPriority(dto.getPriority());
        ticket.setStatus(dto.getStatus() != null ? dto.getStatus() : Ticketstatus.OPEN);
        ticket.setLocation(dto.getLocation());
        ticket.setReportedBy(dto.getReportedBy());
        ticket.setContactDetails(dto.getContactDetails());
        ticket.setAssignedTo(dto.getAssignedTo());
        ticket.setResolutionNotes(dto.getResolutionNotes());
        ticket.setRejectionReason(dto.getRejectionReason());
        ticket.setAttachments(dto.getAttachments());
        return ticket;
    }

    private TicketDTO toDTO(Ticket ticket) {
        TicketDTO dto = new TicketDTO();
        dto.setId(ticket.getId());
        dto.setTitle(ticket.getTitle());
        dto.setDescription(ticket.getDescription());
        dto.setCategory(ticket.getCategory());
        dto.setPriority(ticket.getPriority());
        dto.setStatus(ticket.getStatus());
        dto.setLocation(ticket.getLocation());
        dto.setReportedBy(ticket.getReportedBy());
        dto.setContactDetails(ticket.getContactDetails());
        dto.setAssignedTo(ticket.getAssignedTo());
        dto.setResolutionNotes(ticket.getResolutionNotes());
        dto.setRejectionReason(ticket.getRejectionReason());
        dto.setAttachments(ticket.getAttachments());
        dto.setCreatedAt(ticket.getCreatedAt());
        dto.setUpdatedAt(ticket.getUpdatedAt());
        return dto;
    }

    // ── CRUD ─────────────────────────────────────────────────

    public TicketDTO createTicket(TicketDTO dto) {
        Ticket saved = ticketRepository.save(toEntity(dto));
        return toDTO(saved);
    }

    public List<TicketDTO> getAllTickets() {
        return ticketRepository.findAll()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public TicketDTO getTicketById(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Ticket not found with id: " + id));
        return toDTO(ticket);
    }

    public TicketDTO updateTicket(Long id, TicketDTO dto) {
        Ticket existing = ticketRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Ticket not found with id: " + id));

        existing.setTitle(dto.getTitle());
        existing.setDescription(dto.getDescription());
        existing.setCategory(dto.getCategory());
        existing.setPriority(dto.getPriority());
        existing.setLocation(dto.getLocation());
        existing.setContactDetails(dto.getContactDetails());
        existing.setAssignedTo(dto.getAssignedTo());
        existing.setResolutionNotes(dto.getResolutionNotes());
        existing.setRejectionReason(dto.getRejectionReason());
        existing.setAttachments(dto.getAttachments());

        if (dto.getStatus() != null) {
            existing.setStatus(dto.getStatus());
        }

        return toDTO(ticketRepository.save(existing));
    }

    public TicketDTO updateStatus(Long id, Ticketstatus status) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Ticket not found with id: " + id));
        ticket.setStatus(status);
        return toDTO(ticketRepository.save(ticket));
    }

    public void deleteTicket(Long id) {
        if (!ticketRepository.existsById(id)) {
            throw new EntityNotFoundException("Ticket not found with id: " + id);
        }
        ticketRepository.deleteById(id);
    }

    // ── Filtered Queries ─────────────────────────────────────

    public List<TicketDTO> getByStatus(Ticketstatus status) {
        return ticketRepository.findByStatus(status)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<TicketDTO> getByPriority(Ticketpriority priority) {
        return ticketRepository.findByPriority(priority)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<TicketDTO> getByCategory(Ticketcategory category) {
        return ticketRepository.findByCategory(category)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<TicketDTO> getByReportedBy(String reportedBy) {
        return ticketRepository.findByReportedBy(reportedBy)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<TicketDTO> getByAssignedTo(String assignedTo) {
        return ticketRepository.findByAssignedTo(assignedTo)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }
}