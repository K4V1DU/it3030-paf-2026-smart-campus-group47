package com.sliit.smartcampus.repository;

import com.sliit.smartcampus.model.Resource;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResourceRepo extends JpaRepository<Resource, Long> {
}