package com.rideshare.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:dummy@gmail.com}")
    private String senderEmail;

    private boolean mailAvailable() {
        return mailSender != null;
    }


    public void sendTemporaryPassword(String toEmail, String name, String tempPassword) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(senderEmail);
        message.setTo(toEmail);
        message.setSubject("Welcome to RideShare - Your Temporary Password");

        String body = String.format(
                "Hello %s,\n\n" +
                        "Your RideShare account has been created by the Admin.\n\n" +
                        "Your temporary password is: %s\n\n" +
                        "Please log in and reset your password immediately for security.\n\n" +
                        "Thank you,\n" +
                        "The RideShare Team",
                name, tempPassword
        );

        message.setText(body);

        try {
            if(mailAvailable()) {
                mailSender.send(message);
            }
            System.out.println("Temporary password email sent to: " + toEmail);
        } catch (Exception e) {
            System.err.println("Error sending email to " + toEmail + ": " + e.getMessage());
        }
    }

    // NEW METHOD 1: Driver Ride Post Confirmation
    public void sendRidePostConfirmation(String toEmail, String driverName, String source, String destination, String dateTime, double fare) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(senderEmail);
        message.setTo(toEmail);
        message.setSubject("Ride Posted Successfully - RideShare");

        String body = String.format(
                "Hello %s,\n\n" +
                        "Your ride has been successfully posted!\n\n" +
                        "Details:\n" +
                        "  Route: %s to %s\n" +
                        "  Date & Time: %s\n" +
                        "  Fare Per Seat: ₹%.2f\n\n" +
                        "You will receive a notification when a passenger books a seat.\n\n" +
                        "Thank you for sharing the ride,\n" +
                        "The RideShare Team",
                driverName, source, destination, dateTime, fare
        );

        message.setText(body);

        try {
            if(mailAvailable()) {
                mailSender.send(message);
            }
            System.out.println("Ride post confirmation email sent to driver: " + toEmail);
        } catch (Exception e) {
            System.err.println("Error sending driver ride confirmation email to " + toEmail + ": " + e.getMessage());
        }
    }

    // NEW METHOD 2: Passenger Booking Confirmation (Acceptance)
    public void sendBookingConfirmation(String toEmail, String passengerName, String driverName, String source, String destination, String dateTime, int seats, double amount) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(senderEmail);
        message.setTo(toEmail);
        message.setSubject("Ride Booking Confirmed - RideShare");

        String body = String.format(
                "Hello %s,\n\n" +
                        "Your ride booking has been successfully confirmed and accepted by the driver!\n\n" +
                        "Details:\n" +
                        "  Route: %s to %s\n" +
                        "  Date & Time: %s\n" +
                        "  Seats Booked: %d\n" +
                        "  Total Amount Paid: ₹%.2f\n" +
                        "  Driver: %s\n\n" +
                        "Safe travels!\n\n" +
                        "The RideShare Team",
                passengerName, source, destination, dateTime, seats, amount, driverName
        );

        message.setText(body);

        try {
            if(mailAvailable()) {
                mailSender.send(message);
            }

            System.out.println("Booking confirmation email sent to passenger: " + toEmail);
        } catch (Exception e) {
            System.err.println("Error sending passenger booking confirmation email to " + toEmail + ": " + e.getMessage());
        }
    }

    // NEW METHOD 3: Passenger Booking Cancellation
    public void sendBookingCancellation(String toEmail, String passengerName, String driverName, String source, String destination) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(senderEmail);
        message.setTo(toEmail);
        message.setSubject("Ride Booking Cancelled - RideShare");

        String body = String.format(
                "Hello %s,\n\n" +
                        "We regret to inform you that your ride booking from %s to %s has been **CANCELLED** by the driver (%s).\n\n" +
                        "A full refund has been initiated and should reflect in your account within 3-5 business days.\n\n" +
                        "Please search for another ride immediately.\n\n" +
                        "The RideShare Team",
                passengerName, source, destination, driverName
        );

        message.setText(body);

        try {
            if(mailAvailable()) {
                mailSender.send(message);
            }

            System.out.println("Booking cancellation email sent to passenger: " + toEmail);
        } catch (Exception e) {
            System.err.println("Error sending passenger cancellation email to " + toEmail + ": " + e.getMessage());
        }
    }

    // NEW METHOD 4: Passenger Booking Reschedule
    public void sendBookingReschedule(String toEmail, String passengerName, String driverName, String source, String destination, String newDateTime) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(senderEmail);
        message.setTo(toEmail);
        message.setSubject("Ride Reschedule Notification - RideShare");

        String body = String.format(
                "Hello %s,\n\n" +
                        "Your driver (%s) has requested to **RESCHEDULE** your ride from %s to %s.\n\n" +
                        "The NEW proposed date and time is: **%s**\n\n" +
                        "The details of the ride (source/destination) remain the same.\n\n" +
                        "The RideShare Team",
                passengerName, driverName, source, destination, newDateTime
        );

        message.setText(body);

        try {
            if(mailAvailable()) {
                mailSender.send(message);
            }

            System.out.println("Booking reschedule email sent to passenger: " + toEmail);
        } catch (Exception e) {
            System.err.println("Error sending passenger reschedule email to " + toEmail + ": " + e.getMessage());
        }
    }
}