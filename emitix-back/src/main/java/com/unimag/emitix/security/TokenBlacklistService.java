package com.unimag.emitix.security;

import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory token blacklist for logout support.
 * For production, replace with Redis or DB-backed implementation.
 */
@Service
public class TokenBlacklistService {

    private final Set<String> blacklistedTokens = ConcurrentHashMap.newKeySet();

    public void blacklist(String token) {
        blacklistedTokens.add(token);
    }

    public boolean isBlacklisted(String token) {
        return blacklistedTokens.contains(token);
    }

    public void removeFromBlacklist(String token) {
        blacklistedTokens.remove(token);
    }

    public int size() {
        return blacklistedTokens.size();
    }
}
