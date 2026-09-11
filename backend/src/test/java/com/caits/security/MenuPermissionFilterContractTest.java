package com.caits.security;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Structural guards for MenuPermissionFilter (txn routes + CRUD action mapping).
 * Full Spring MVC CSRF/IDOR suites need an integration profile with DB.
 */
class MenuPermissionFilterContractTest {

    @Test
    void filterIsSpringComponent() {
        assertTrue(MenuPermissionFilter.class.isAnnotationPresent(org.springframework.stereotype.Component.class));
    }

    @Test
    void requiredActionEnumCoversCrudApproveRejectPrint() throws Exception {
        Class<?>[] nested = MenuPermissionFilter.class.getDeclaredClasses();
        Class<?> action = Arrays.stream(nested)
                .filter(c -> c.getSimpleName().equals("RequiredAction"))
                .findFirst()
                .orElseThrow();
        Object[] constants = action.getEnumConstants();
        assertNotNull(constants);
        SetNames names = new SetNames();
        for (Object c : constants) {
            names.add(c.toString());
        }
        for (String expected : new String[]{"VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "REJECT", "PRINT"}) {
            assertTrue(names.contains(expected), "missing " + expected);
        }
    }

    @Test
    void resolveActionMethodExists() throws Exception {
        Method m = MenuPermissionFilter.class.getDeclaredMethod("resolveAction", String.class, String.class);
        assertTrue(Modifier.isStatic(m.getModifiers()));
        m.setAccessible(true);
        Object approve = m.invoke(null, "POST", "/api/v1/requisitions/12/approve");
        assertEquals("APPROVE", approve.toString());
        Object create = m.invoke(null, "POST", "/api/v1/grn");
        assertEquals("CREATE", create.toString());
        Object edit = m.invoke(null, "PUT", "/api/v1/vendors/1");
        assertEquals("EDIT", edit.toString());
        Object del = m.invoke(null, "DELETE", "/api/v1/grn/9");
        assertEquals("DELETE", del.toString());
        Object view = m.invoke(null, "GET", "/api/v1/vendors/1");
        assertEquals("VIEW", view.toString());
        Object reject = m.invoke(null, "POST", "/api/v1/requisitions/3/reject");
        assertEquals("REJECT", reject.toString());
    }

    private static final class SetNames {
        private final java.util.HashSet<String> inner = new java.util.HashSet<>();
        void add(String s) { inner.add(s); }
        boolean contains(String s) { return inner.contains(s); }
    }
}
