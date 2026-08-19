package com.caits.common.spec;

import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public final class SpecUtils {
    private SpecUtils() {}

    public static <T> Specification<T> andAll(List<Specification<T>> specs) {
        Specification<T> result = null;
        for (Specification<T> s : specs) {
            if (s == null) continue;
            result = result == null ? s : result.and(s);
        }
        return result == null ? (root, q, cb) -> cb.conjunction() : result;
    }

    public static <T> Specification<T> activeEquals(String field, Boolean isActive) {
        if (isActive == null) return null;
        return (root, q, cb) -> cb.equal(root.get(field), isActive);
    }

    public static <T> Specification<T> searchContains(String search, String... fields) {
        if (search == null || search.isBlank()) return null;
        String pattern = "%" + search.trim().toLowerCase() + "%";
        return (root, q, cb) -> {
            List<Predicate> ors = new ArrayList<>();
            for (String f : fields) {
                Path<String> path = root.get(f);
                ors.add(cb.like(cb.lower(path), pattern));
            }
            return cb.or(ors.toArray(new Predicate[0]));
        };
    }

    public static <T> Specification<T> eq(String field, Object value) {
        if (value == null) return null;
        return (root, q, cb) -> cb.equal(root.get(field), value);
    }

    /**
     * Restricts {@code field} to the given values.
     * {@code null} values → no restriction (same convention as {@link #eq}).
     * Empty collection → matches nothing (security default: deny when the allow-list is empty).
     */
    public static <T> Specification<T> in(String field, Collection<?> values) {
        if (values == null) return null;
        if (values.isEmpty()) return (root, q, cb) -> cb.disjunction();
        return (root, q, cb) -> root.get(field).in(values);
    }

    public static <T> Specification<T> notTrue(String field) {
        return (root, q, cb) -> cb.or(cb.isFalse(root.get(field)), cb.isNull(root.get(field)));
    }

    public static <T> Specification<T> combine(Specification<T>... specs) {
        List<Specification<T>> list = new ArrayList<>();
        for (Specification<T> s : specs) {
            if (s != null) list.add(s);
        }
        return andAll(list);
    }
}
