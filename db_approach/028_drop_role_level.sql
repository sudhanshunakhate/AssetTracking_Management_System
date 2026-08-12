-- Remove role level from sysm_roles_mst (no longer used in Role & Menu Mapping).
SET search_path TO caits_local;

ALTER TABLE sysm_roles_mst
    DROP COLUMN IF EXISTS rol_role_level;
