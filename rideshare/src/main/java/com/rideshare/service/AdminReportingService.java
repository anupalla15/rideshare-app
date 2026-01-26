package com.rideshare.service;

import com.rideshare.dto.AdminReportDTO;
import com.rideshare.entity.Payment;
import com.rideshare.entity.PaymentStatus;
import com.rideshare.repository.BookingRepository;
import com.rideshare.repository.PaymentRepository;
import com.rideshare.repository.RideRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminReportingService {

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    public AdminReportDTO getSystemReport() {
        AdminReportDTO report = new AdminReportDTO();

        // 1. Total Rides
        report.setTotalRides(rideRepository.count());

        // 2. Total Bookings
        report.setTotalBookings(bookingRepository.count());

        // 3. Total Payments
        List<Payment> allPayments = paymentRepository.findAll();
        report.setTotalPayments(allPayments.size());

        // 4. Total Earnings (Sum of successful payments)
        report.setTotalEarnings(allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
                .mapToDouble(Payment::getAmount)
                .sum());

        // 5. FIXED: Prevent NullPointerException on booking status
        report.setTotalCancellations(
                bookingRepository.findAll().stream()
                        .filter(b -> {
                            String status = b.getStatus();
                            return status != null && (
                                    status.equalsIgnoreCase("DENIED") ||
                                            status.equalsIgnoreCase("CANCELED")
                            );
                        })
                        .count()
        );

        return report;
    }
}
