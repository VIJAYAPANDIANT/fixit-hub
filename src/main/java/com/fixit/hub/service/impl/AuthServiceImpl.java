package com.fixit.hub.service.impl;

import com.fixit.hub.domain.entity.*;
import com.fixit.hub.dto.AuthRequest;
import com.fixit.hub.dto.AuthResponse;
import com.fixit.hub.dto.RegisterRequest;
import com.fixit.hub.exception.BadRequestException;
import com.fixit.hub.repository.jpa.*;
import com.fixit.hub.security.JwtUtils;
import com.fixit.hub.service.AuthService;
import com.fixit.hub.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email is already in use");
        }

        // Auto-bootstrap a default organization if none exists
        if (organizationRepository.count() == 0) {
            Organization defaultOrg = Organization.builder()
                    .name("Default Organization")
                    .build();
            organizationRepository.save(defaultOrg);
        }

        // Users initially register with PENDING_VERIFICATION status
        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .name(request.name())
                .role(request.role())
                .status(UserRole.ADMIN == request.role() || UserRole.OWNER == request.role() ? "ACTIVE" : "PENDING_VERIFICATION")
                .build();

        userRepository.save(user);

        // Generate verification token if status is pending
        String verifyToken = "";
        if ("PENDING_VERIFICATION".equals(user.getStatus())) {
            verifyToken = UUID.randomUUID().toString();
            VerificationToken verificationToken = VerificationToken.builder()
                    .user(user)
                    .token(verifyToken)
                    .expiryDate(Instant.now().plus(24, ChronoUnit.HOURS))
                    .build();
            verificationTokenRepository.save(verificationToken);
            emailService.sendVerificationEmail(user.getEmail(), verifyToken);
        }

        // Generate tokens
        String accessToken = jwtUtils.generateToken(user);
        String refreshToken = createAndSaveRefreshToken(user);

        return new AuthResponse(
                accessToken,
                refreshToken,
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole()
        );
    }

    @Override
    @Transactional
    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + request.email()));

        if ("PENDING_VERIFICATION".equals(user.getStatus())) {
            throw new BadRequestException("Please verify your email before logging in.");
        }
        if ("SUSPENDED".equals(user.getStatus())) {
            throw new BadRequestException("This account has been suspended.");
        }

        String accessToken = jwtUtils.generateToken(user);
        String refreshToken = createAndSaveRefreshToken(user);

        return new AuthResponse(
                accessToken,
                refreshToken,
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole()
        );
    }

    @Override
    @Transactional
    public void verifyEmail(String token) {
        VerificationToken verificationToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid verification token"));

        if (verificationToken.getExpiryDate().isBefore(Instant.now())) {
            verificationTokenRepository.delete(verificationToken);
            throw new BadRequestException("Verification token has expired. Please register again.");
        }

        User user = verificationToken.getUser();
        user.setStatus("ACTIVE");
        userRepository.save(user);

        verificationTokenRepository.delete(verificationToken);
        log.info("User {} email verified successfully.", user.getEmail());
    }

    @Override
    @Transactional
    public void forgotPassword(String email) {
        // Prevent user enumeration by returning cleanly if email doesn't exist
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            log.info("Recovery requested for non-existent email: {}. Ignored for security.", email);
            return;
        }

        String resetToken = UUID.randomUUID().toString();
        PasswordResetToken passwordResetToken = PasswordResetToken.builder()
                .user(user)
                .token(resetToken)
                .expiryDate(Instant.now().plus(1, ChronoUnit.HOURS))
                .build();

        passwordResetTokenRepository.save(passwordResetToken);
        emailService.sendPasswordResetEmail(user.getEmail(), resetToken);
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid or expired password reset token"));

        if (resetToken.getExpiryDate().isBefore(Instant.now())) {
            passwordResetTokenRepository.delete(resetToken);
            throw new BadRequestException("Password reset token has expired");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Clean up reset token
        passwordResetTokenRepository.delete(resetToken);
        
        // Revoke active sessions / refresh tokens to force re-logins for security
        refreshTokenRepository.deleteByUser(user);
        log.info("Password successfully reset for user: {}", user.getEmail());
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(String refreshTokenStr) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenStr)
                .orElseThrow(() -> new BadRequestException("Invalid or expired refresh token"));

        if (refreshToken.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new BadRequestException("Refresh token has expired. Please log in again.");
        }

        User user = refreshToken.getUser();
        String newAccessToken = jwtUtils.generateToken(user);
        
        // Rotate Refresh Token
        String newRefreshTokenStr = createAndSaveRefreshToken(user);

        return new AuthResponse(
                newAccessToken,
                newRefreshTokenStr,
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole()
        );
    }

    @Override
    @Transactional
    public void logout(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            refreshTokenRepository.deleteByUser(user);
            log.info("User {} logged out, refresh tokens cleared.", email);
        }
    }

    private String createAndSaveRefreshToken(User user) {
        // Enforce 1-to-1 session refresh: delete previous refresh token for this user
        refreshTokenRepository.deleteByUser(user);

        String tokenStr = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(tokenStr)
                .expiryDate(Instant.now().plus(7, ChronoUnit.DAYS)) // 7 Days expiry
                .build();

        refreshTokenRepository.save(refreshToken);
        return tokenStr;
    }
}
