package com.rideshare.controller;

import com.rideshare.entity.Ride;
import com.rideshare.entity.User;
import com.rideshare.repository.RideRepository;
import com.rideshare.repository.UserRepository;
import com.rideshare.service.FileStorageService;
import com.rideshare.service.GeoService;
import com.rideshare.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import com.rideshare.dto.RideDetailsResponse;
import com.rideshare.service.RideSearchService;

import java.time.LocalDate;
import java.util.List;
import java.util.ArrayList;
import java.util.Set;
import java.util.HashSet;
import org.springframework.data.domain.Page; // NEW IMPORT
import org.springframework.data.domain.Pageable; // NEW IMPORT
import org.springframework.data.domain.PageRequest; // NEW IMPORT

@RestController
@RequestMapping("/api/rides")
public class RideController {

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GeoService geoService;

    @Autowired
    private RideSearchService rideSearchService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private EmailService emailService;

    @PostMapping(value = "/post", consumes = {"multipart/form-data"})
    public Ride postRide(
            @RequestPart("rideData") Ride ride,
            @RequestPart(value = "vehicleImages", required = false) List<MultipartFile> vehicleImages) throws IOException {


        // Fetch the Driver before proceeding
        User driver = userRepository.findById(ride.getDriverId())
                .orElseThrow(() -> new RuntimeException("Driver not found.")); //

        // NEW SECURITY CHECKS (Conditions 2 & 4)
        if (driver.isBlocked()) { //
            throw new RuntimeException("Posting failed: Your account is currently blocked.");
        }

        if (!driver.isVerified()) {
            throw new RuntimeException("Posting failed: Your account is not yet verified by admin. Please wait for verification.");
        }

        // END NEW SECURITY CHECKS

        List<String> imagePaths = new ArrayList<>();

        if (vehicleImages != null && !vehicleImages.isEmpty()) {
            for (MultipartFile vehicleImage : vehicleImages) {
                if (vehicleImage != null && !vehicleImage.isEmpty()) {
                    String imagePath = fileStorageService.storeFile(vehicleImage); //
                    imagePaths.add(imagePath);
                }
            }
        }
        ride.setVehicleImageReference(String.join(";", imagePaths));

        double distance = geoService.getDistanceInKm(ride.getSource(), ride.getDestination()); //
        double totalFare = geoService.calculateFare(distance); //
        double farePerSeat = totalFare / ride.getAvailableSeats();
        ride.setFarePerSeat(farePerSeat);

        Ride savedRide = rideRepository.save(ride); //

        // 🆕 NEW LOGIC: Send ride posted confirmation email to driver
        emailService.sendRidePostConfirmation( //
                driver.getEmail(),
                driver.getName(),
                savedRide.getSource(),
                savedRide.getDestination(),
                savedRide.getDateTime().toString(),
                farePerSeat
        );
        // ----------------------------------------------------

        return savedRide;
    }

    // ✅ Search rides - UPDATED TO INCLUDE PARTIAL MATCHES (Route Matching)
    @GetMapping("/search")
    public List<RideDetailsResponse> searchRides(
            @RequestParam String source,
            @RequestParam String destination,
            @RequestParam String date
    ) {
        LocalDate searchDate = LocalDate.parse(date);

        // 1. Get Direct Matches (Exact Source and Destination)
        List<Ride> directMatches = rideRepository.findRidesBySourceDestinationAndDate(source, destination, searchDate); //

        // 2. Get Partial Matches (Rides along the route - simple heuristic)
        // NOTE: findPartialRidesBySourceOrDestination method must be added to RideRepository
        List<Ride> partialMatches = rideRepository.findPartialRidesBySourceOrDestination(source, destination, searchDate); //

        // 3. Combine and remove duplicates using a Set
        Set<Ride> allRides = new HashSet<>(directMatches);
        allRides.addAll(partialMatches);

        return rideSearchService.searchRides(source, destination, date); //
    }

    @GetMapping("/driver/{driverId}/history")
    public Page<Ride> getDriverRideHistory(
            @PathVariable Long driverId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return rideRepository.findByDriverId(driverId, pageable); //
    }
    @GetMapping("/admin/rides")
    public List<Ride> getAllRides() {
        return rideRepository.findAll();
    }
}