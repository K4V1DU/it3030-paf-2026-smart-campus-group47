package com.sliit.smartcampus.repository;

import com.sliit.smartcampus.model.Ticket;
import com.sliit.smartcampus.model.enums.Ticketcategory;
import com.sliit.smartcampus.model.enums.Ticketpriority;
import com.sliit.smartcampus.model.enums.Ticketstatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByStatus(Ticketstatus status);
    List<Ticket> findByPriority(Ticketpriority priority);
    List<Ticket> findByCategory(Ticketcategory category);
    List<Ticket> findByReportedBy(String reportedBy);
    List<Ticket> findByAssignedTo(String assignedTo);
    List<Ticket> findByStatusAndPriority(Ticketstatus status, Ticketpriority priority);
}