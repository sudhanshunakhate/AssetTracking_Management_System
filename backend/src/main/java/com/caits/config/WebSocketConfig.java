package com.caits.config;

import com.caits.security.AuthCookieService;
import com.caits.security.JwtService;
import com.caits.security.StompPrincipal;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final String HANDSHAKE_TOKEN = "caits.ws.token";

    private final JwtService jwtService;
    private final AuthCookieService authCookieService;

    public WebSocketConfig(JwtService jwtService, AuthCookieService authCookieService) {
        this.jwtService = jwtService;
        this.authCookieService = authCookieService;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/queue", "/topic");
        config.setUserDestinationPrefix("/user");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .addInterceptors(cookieHandshakeInterceptor())
                .setAllowedOriginPatterns("http://localhost:5173", "http://127.0.0.1:5173");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String token = null;
                    if (accessor.getSessionAttributes() != null) {
                        Object fromHandshake = accessor.getSessionAttributes().get(HANDSHAKE_TOKEN);
                        if (fromHandshake instanceof String s && !s.isBlank()) {
                            token = s;
                        }
                    }
                    if (token == null || token.isBlank()) {
                        throw new IllegalArgumentException("WebSocket authentication required");
                    }
                    var user = jwtService.toCurrentUser(token);
                    accessor.setUser(new StompPrincipal(user.userId(), user.loginId(), user.roleCode()));
                }
                return message;
            }
        });
    }

    private HandshakeInterceptor cookieHandshakeInterceptor() {
        return new HandshakeInterceptor() {
            @Override
            public boolean beforeHandshake(
                    @NonNull ServerHttpRequest request,
                    @NonNull ServerHttpResponse response,
                    @NonNull WebSocketHandler wsHandler,
                    @NonNull Map<String, Object> attributes) {
                if (request instanceof ServletServerHttpRequest servletRequest) {
                    String token = authCookieService.readToken(servletRequest.getServletRequest());
                    if (token != null && !token.isBlank()) {
                        attributes.put(HANDSHAKE_TOKEN, token);
                    }
                }
                return true;
            }

            @Override
            public void afterHandshake(
                    @NonNull ServerHttpRequest request,
                    @NonNull ServerHttpResponse response,
                    @NonNull WebSocketHandler wsHandler,
                    Exception exception) {
                // no-op
            }
        };
    }
}
