package com.fixit.hub.service.impl;

import com.fixit.hub.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    @Override
    public void sendVerificationEmail(String email, String token) {
        String link = "http://localhost:8080/api/auth/verify?token=" + token;
        log.info("""
                
                ======================================================================
                📧 EMAIL VERIFICATION DISPATCHED TO: {}
                Verify your account by copying or clicking the link below:
                {}
                ======================================================================
                """, email, link);
    }

    @Override
    public void sendPasswordResetEmail(String email, String token) {
        String link = "http://localhost:8080/api/auth/reset-password?token=" + token;
        log.info("""
                
                ======================================================================
                📧 PASSWORD RECOVERY DISPATCHED TO: {}
                Reset your account credentials by copying or clicking the link below:
                {}
                ======================================================================
                """, email, link);
    }
}
