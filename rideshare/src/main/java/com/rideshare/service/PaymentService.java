package com.rideshare.service;

import com.rideshare.entity.Payment;
import com.rideshare.entity.PaymentStatus;
import com.rideshare.entity.DriverWallet;
import com.rideshare.repository.PaymentRepository;
import com.rideshare.repository.DriverWalletRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private DriverWalletRepository driverWalletRepository;

    // Inject Stripe Secret Key
    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    public String createPaymentIntent(double amount) {
        Stripe.apiKey = stripeSecretKey;
        long amountInPaise = (long) (amount * 100);

// Stripe requires at least ₹50 (5000 paise)
        if (amountInPaise < 5000) {
            amountInPaise = 5000;
        }

        try {
            // Step 1: Create a Payment Intent on the server to get the client secret
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setCurrency("inr")
                    .setAmount(amountInPaise)
                    .setCaptureMethod(PaymentIntentCreateParams.CaptureMethod.AUTOMATIC)
                    .addPaymentMethodType("card")
                    .build();

            PaymentIntent intent = PaymentIntent.create(params);
            return intent.getClientSecret();

        } catch (com.stripe.exception.StripeException e) {
            System.err.println("Stripe Error creating Intent: " + e.getMessage());
            throw new RuntimeException("Failed to create Stripe Payment Intent: " + e.getMessage());
        }
    }

    /**
     * Final Confirmation: Retrieves the Payment Intent from Stripe to confirm status,
     * which fixes the "No such PaymentMethod" error.
     */
    public String createStripePaymentIntentAndConfirm(Long bookingId, Long passengerId, double amount, Long rideId, String paymentIntentId) {
        Stripe.apiKey = stripeSecretKey;

        try {
            // CRITICAL FIX: RETRIEVE the Payment Intent using the ID (pi_...) passed from the frontend.
            PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);

            // 2. Process Stripe status: Check for succeeded
            if ("succeeded".equals(intent.getStatus())) {
                // Payment succeeded immediately
                Payment payment = new Payment();
                payment.setBookingId(bookingId);
                payment.setPassengerId(passengerId);
                payment.setAmount(amount);
                payment.setTransactionId(intent.getId());
                payment.setStatus(PaymentStatus.SUCCESS);
                payment.setPaymentDate(LocalDateTime.now());
                paymentRepository.save(payment);

                return "Payment successful! Stripe Transaction ID: " + intent.getId();

            } else if ("requires_action".equals(intent.getStatus())) {
                // This case handles a return from a 3DS redirect if the final status isn't yet 'succeeded'
                String redirectUrl = intent.getNextAction().getRedirectToUrl().getUrl();
                throw new RuntimeException("STRIPE_3DS_REQUIRED:" + redirectUrl);
            } else {
                throw new RuntimeException("Payment Intent found, but status is not successful: " + intent.getStatus());
            }

        } catch (com.stripe.exception.StripeException e) {
            System.err.println("Stripe Error: " + e.getMessage());
            throw new RuntimeException("Stripe API call failed during confirmation: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Internal Error recording payment: " + e.getMessage());
            throw new RuntimeException("Internal error during payment: " + e.getMessage());
        }
    }

    /**
     * This method remains unchanged as it contains local business logic (driver payout).
     */
    public void processDriverPayout(Long driverId, double totalAmount) {
        // Simple simulation: Assume 10% commission
        double commission = totalAmount * 0.10;
        double payoutAmount = totalAmount - commission;

        // 1. Find or Create Driver Wallet
        DriverWallet wallet = driverWalletRepository.findByDriverId(driverId)
                .orElseGet(() -> {
                    // Create new wallet if none exists
                    DriverWallet newWallet = new DriverWallet();
                    newWallet.setDriverId(driverId);
                    return newWallet;
                });

        // 2. Update Wallet Balances
        wallet.setBalance(wallet.getBalance() + payoutAmount);
        wallet.setTotalEarnings(wallet.getTotalEarnings() + payoutAmount);
        wallet.setTotalCommission(wallet.getTotalCommission() + commission);

        // 3. Save to database
        driverWalletRepository.save(wallet);

        System.out.println("DRIVER WALLET UPDATED: Driver " + driverId
                + ". Payout: ₹" + String.format("%.2f", payoutAmount)
                + ". New Balance: ₹" + String.format("%.2f", wallet.getBalance()));
    }
}