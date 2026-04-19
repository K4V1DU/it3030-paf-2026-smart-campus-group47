package com.sliit.smartcampus.security;

import com.sliit.smartcampus.model.User;
import com.sliit.smartcampus.model.enums.UserRole;
import com.sliit.smartcampus.model.enums.UserStatus;
import com.sliit.smartcampus.repository.UserRepo;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepo userRepo;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email    = oAuth2User.getAttribute("email");
        String name     = oAuth2User.getAttribute("name");
        String googleId = oAuth2User.getAttribute("sub");

        // Find or create user
        User user = userRepo.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setName(name);
            newUser.setEmail(email);
            newUser.setOauthProvider("google");
            newUser.setOauthProviderId(googleId);
            newUser.setRole(UserRole.USER);
            newUser.setStatus(UserStatus.ACTIVE);
            return userRepo.save(newUser);
        });

        // Generate JWT
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        // Redirect to frontend with token and role
        String redirectUrl = "http://localhost:3000/oauth2/callback"
                + "?token=" + token
                + "&role=" + user.getRole().name()
                + "&name=" + java.net.URLEncoder.encode(user.getName(), "UTF-8")
                + "&email=" + user.getEmail()
                + "&userId=" + user.getId();

        response.sendRedirect(redirectUrl);
    }
}