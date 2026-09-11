package com.caits.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "org_entity_mst")
public class OrgEntityMst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ent_entity_id", nullable = false)
    private Integer entEntityId;

    @Column(name = "ent_entity_code", nullable = false)
    private String entEntityCode;

    @Column(name = "ent_entity_name", nullable = false)
    private String entEntityName;

    @Column(name = "ent_short_name")
    private String entShortName;

    @Column(name = "ent_legal_name")
    private String entLegalName;

    @Convert(converter = com.caits.security.EncryptedStringConverter.class)
    @Column(name = "ent_gstin", length = 512)
    private String entGstin;

    @Convert(converter = com.caits.security.EncryptedStringConverter.class)
    @Column(name = "ent_pan_no", length = 512)
    private String entPanNo;

    @Column(name = "ent_cin")
    private String entCin;

    @Column(name = "ent_add1")
    private String entAdd1;

    @Column(name = "ent_add2")
    private String entAdd2;

    @Column(name = "ent_city")
    private String entCity;

    @Column(name = "ent_state")
    private String entState;

    @Column(name = "ent_pin")
    private String entPin;

    @Column(name = "ent_country")
    private String entCountry;

    @Column(name = "ent_contact_person")
    private String entContactPerson;

    @Column(name = "ent_phone")
    private String entPhone;

    @Column(name = "ent_email")
    private String entEmail;

    @Column(name = "ent_isactive", nullable = false)
    private Boolean entIsactive;

    @Column(name = "ent_created_by")
    private String entCreatedBy;

    @Column(name = "ent_created_on", nullable = false)
    private LocalDateTime entCreatedOn;

    @Column(name = "ent_modified_by")
    private String entModifiedBy;

    @Column(name = "ent_modified_on")
    private LocalDateTime entModifiedOn;

    public Integer getEntEntityId() { return entEntityId; }
    public void setEntEntityId(Integer entEntityId) { this.entEntityId = entEntityId; }

    public String getEntEntityCode() { return entEntityCode; }
    public void setEntEntityCode(String entEntityCode) { this.entEntityCode = entEntityCode; }

    public String getEntEntityName() { return entEntityName; }
    public void setEntEntityName(String entEntityName) { this.entEntityName = entEntityName; }

    public String getEntShortName() { return entShortName; }
    public void setEntShortName(String entShortName) { this.entShortName = entShortName; }

    public String getEntLegalName() { return entLegalName; }
    public void setEntLegalName(String entLegalName) { this.entLegalName = entLegalName; }

    public String getEntGstin() { return entGstin; }
    public void setEntGstin(String entGstin) { this.entGstin = entGstin; }

    public String getEntPanNo() { return entPanNo; }
    public void setEntPanNo(String entPanNo) { this.entPanNo = entPanNo; }

    public String getEntCin() { return entCin; }
    public void setEntCin(String entCin) { this.entCin = entCin; }

    public String getEntAdd1() { return entAdd1; }
    public void setEntAdd1(String entAdd1) { this.entAdd1 = entAdd1; }

    public String getEntAdd2() { return entAdd2; }
    public void setEntAdd2(String entAdd2) { this.entAdd2 = entAdd2; }

    public String getEntCity() { return entCity; }
    public void setEntCity(String entCity) { this.entCity = entCity; }

    public String getEntState() { return entState; }
    public void setEntState(String entState) { this.entState = entState; }

    public String getEntPin() { return entPin; }
    public void setEntPin(String entPin) { this.entPin = entPin; }

    public String getEntCountry() { return entCountry; }
    public void setEntCountry(String entCountry) { this.entCountry = entCountry; }

    public String getEntContactPerson() { return entContactPerson; }
    public void setEntContactPerson(String entContactPerson) { this.entContactPerson = entContactPerson; }

    public String getEntPhone() { return entPhone; }
    public void setEntPhone(String entPhone) { this.entPhone = entPhone; }

    public String getEntEmail() { return entEmail; }
    public void setEntEmail(String entEmail) { this.entEmail = entEmail; }

    public Boolean getEntIsactive() { return entIsactive; }
    public void setEntIsactive(Boolean entIsactive) { this.entIsactive = entIsactive; }

    public String getEntCreatedBy() { return entCreatedBy; }
    public void setEntCreatedBy(String entCreatedBy) { this.entCreatedBy = entCreatedBy; }

    public LocalDateTime getEntCreatedOn() { return entCreatedOn; }
    public void setEntCreatedOn(LocalDateTime entCreatedOn) { this.entCreatedOn = entCreatedOn; }

    public String getEntModifiedBy() { return entModifiedBy; }
    public void setEntModifiedBy(String entModifiedBy) { this.entModifiedBy = entModifiedBy; }

    public LocalDateTime getEntModifiedOn() { return entModifiedOn; }
    public void setEntModifiedOn(LocalDateTime entModifiedOn) { this.entModifiedOn = entModifiedOn; }

}
