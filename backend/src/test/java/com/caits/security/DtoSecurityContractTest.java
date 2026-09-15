package com.caits.security;

import com.caits.modules.masters.dto.MasterDtos.EntityDto;
import com.caits.modules.masters.dto.MasterDtos.VendorDto;
import com.caits.modules.transactions.TxnDtos.ListItem;
import org.junit.jupiter.api.Test;

import java.lang.reflect.RecordComponent;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

class DtoSecurityContractTest {

    private static final Set<String> BANNED = Set.of(
            "password", "passwordhash", "usrpasswordhash", "secret", "token", "jwttoken",
            "passwordcipher", "cipher");

    @Test
    void userDtoMustNotExposeSecrets() {
        assertNoBanned(com.caits.modules.masters.dto.MasterDtos.UserDto.class);
    }

    @Test
    void vendorAndEntityDtosAllowPanGstinButNotSecrets() {
        assertNoBanned(VendorDto.class);
        assertNoBanned(EntityDto.class);
        assertTrue(names(VendorDto.class).contains("panno"));
        assertTrue(names(VendorDto.class).contains("gstin"));
    }

    @Test
    void txnListItemOmitsPartyGstin() {
        Set<String> names = names(ListItem.class);
        assertFalse(names.contains("partygstin"), "ListItem must not expose partyGstin");
    }

    @Test
    void jwtClaimsAreMinimal() {
        assertEquals(1, Arrays.stream(JwtService.class.getDeclaredMethods())
                .filter(m -> m.getName().equals("createToken"))
                .findFirst()
                .orElseThrow()
                .getParameterCount());
    }

    @Test
    void authCookieIsHttpOnlyName() {
        assertEquals("CAITS_SESSION", AuthCookieService.COOKIE_NAME);
    }

    private static void assertNoBanned(Class<?> type) {
        Set<String> names = names(type);
        for (String banned : BANNED) {
            assertFalse(names.contains(banned), type.getSimpleName() + " must not expose " + banned);
        }
    }

    private static Set<String> names(Class<?> type) {
        return Arrays.stream(type.getRecordComponents())
                .map(RecordComponent::getName)
                .map(n -> n.toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());
    }
}
