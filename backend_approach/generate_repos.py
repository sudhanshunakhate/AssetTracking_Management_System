"""Generate Spring Data JPA repository interfaces for all entities."""
from pathlib import Path

ENTITY_DIR = Path(__file__).resolve().parents[1] / "backend/src/main/java/com/caits/domain/entity"
REPO_DIR = Path(__file__).resolve().parents[1] / "backend/src/main/java/com/caits/domain/repository"

REPO_DIR.mkdir(parents=True, exist_ok=True)

for f in ENTITY_DIR.glob("*.java"):
    name = f.stem
    content = f"""package com.caits.domain.repository;

import com.caits.domain.entity.{name};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface {name}Repository extends JpaRepository<{name}, Integer>, JpaSpecificationExecutor<{name}> {{
}}
"""
    out = REPO_DIR / f"{name}Repository.java"
    out.write_text(content, encoding="utf-8")
    print(out.name)

print("done", len(list(REPO_DIR.glob('*.java'))))
