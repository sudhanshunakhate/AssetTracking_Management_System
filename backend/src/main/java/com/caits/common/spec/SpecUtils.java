package com.caits.common.spec;

import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
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

    @SafeVarargs
    public static <T> Specification<T> combine(Specification<T>... specs) {
        List<Specification<T>> list = new ArrayList<>();
        for (Specification<T> s : specs) {
            if (s != null) list.add(s);
        }
        return andAll(list);
    }
}
