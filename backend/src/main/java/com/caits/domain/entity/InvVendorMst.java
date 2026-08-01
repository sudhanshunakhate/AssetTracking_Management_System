package com.caits.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inv_vendor_mst", schema = "caits_local")
public class InvVendorMst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vnd_vendor_id", nullable = false)
    private Integer vndVendorId;

    @Column(name = "vnd_vendor_code", nullable = false)
    private String vndVendorCode;

    @Column(name = "vnd_vendor_name", nullable = false)
    private String vndVendorName;

    @Column(name = "vnd_party_type", nullable = false)
    private String vndPartyType;

    @Column(name = "vnd_gstin")
    private String vndGstin;

    @Column(name = "vnd_pan_no")
    private String vndPanNo;

    @Column(name = "vnd_rating")
    private Integer vndRating;

    @Column(name = "vnd_add1")
    private String vndAdd1;

    @Column(name = "vnd_add2")
    private String vndAdd2;

    @Column(name = "vnd_city")
    private String vndCity;

    @Column(name = "vnd_state")
    private String vndState;

    @Column(name = "vnd_pin")
    private String vndPin;

    @Column(name = "vnd_country")
    private String vndCountry;

    @Column(name = "vnd_contact_person")
    private String vndContactPerson;

    @Column(name = "vnd_phone", nullable = false)
    private String vndPhone;

    @Column(name = "vnd_alt_phone")
    private String vndAltPhone;

    @Column(name = "vnd_email")
    private String vndEmail;

    @Column(name = "vnd_website")
    private String vndWebsite;

    @Column(name = "vnd_notes")
    private String vndNotes;

    @Column(name = "vnd_isactive", nullable = false)
    private Boolean vndIsactive;

    @Column(name = "vnd_created_by")
    private String vndCreatedBy;

    @Column(name = "vnd_created_on", nullable = false)
    private LocalDateTime vndCreatedOn;

    @Column(name = "vnd_modified_by")
    private String vndModifiedBy;

    @Column(name = "vnd_modified_on")
    private LocalDateTime vndModifiedOn;

    public Integer getVndVendorId() { return vndVendorId; }
    public void setVndVendorId(Integer vndVendorId) { this.vndVendorId = vndVendorId; }

    public String getVndVendorCode() { return vndVendorCode; }
    public void setVndVendorCode(String vndVendorCode) { this.vndVendorCode = vndVendorCode; }

    public String getVndVendorName() { return vndVendorName; }
    public void setVndVendorName(String vndVendorName) { this.vndVendorName = vndVendorName; }

    public String getVndPartyType() { return vndPartyType; }
    public void setVndPartyType(String vndPartyType) { this.vndPartyType = vndPartyType; }

    public String getVndGstin() { return vndGstin; }
    public void setVndGstin(String vndGstin) { this.vndGstin = vndGstin; }

    public String getVndPanNo() { return vndPanNo; }
    public void setVndPanNo(String vndPanNo) { this.vndPanNo = vndPanNo; }

    public Integer getVndRating() { return vndRating; }
    public void setVndRating(Integer vndRating) { this.vndRating = vndRating; }

    public String getVndAdd1() { return vndAdd1; }
    public void setVndAdd1(String vndAdd1) { this.vndAdd1 = vndAdd1; }

    public String getVndAdd2() { return vndAdd2; }
    public void setVndAdd2(String vndAdd2) { this.vndAdd2 = vndAdd2; }

    public String getVndCity() { return vndCity; }
    public void setVndCity(String vndCity) { this.vndCity = vndCity; }

    public String getVndState() { return vndState; }
    public void setVndState(String vndState) { this.vndState = vndState; }

    public String getVndPin() { return vndPin; }
    public void setVndPin(String vndPin) { this.vndPin = vndPin; }

    public String getVndCountry() { return vndCountry; }
    public void setVndCountry(String vndCountry) { this.vndCountry = vndCountry; }

    public String getVndContactPerson() { return vndContactPerson; }
    public void setVndContactPerson(String vndContactPerson) { this.vndContactPerson = vndContactPerson; }

    public String getVndPhone() { return vndPhone; }
    public void setVndPhone(String vndPhone) { this.vndPhone = vndPhone; }

    public String getVndAltPhone() { return vndAltPhone; }
    public void setVndAltPhone(String vndAltPhone) { this.vndAltPhone = vndAltPhone; }

    public String getVndEmail() { return vndEmail; }
    public void setVndEmail(String vndEmail) { this.vndEmail = vndEmail; }

    public String getVndWebsite() { return vndWebsite; }
    public void setVndWebsite(String vndWebsite) { this.vndWebsite = vndWebsite; }

    public String getVndNotes() { return vndNotes; }
    public void setVndNotes(String vndNotes) { this.vndNotes = vndNotes; }

    public Boolean getVndIsactive() { return vndIsactive; }
    public void setVndIsactive(Boolean vndIsactive) { this.vndIsactive = vndIsactive; }

    public String getVndCreatedBy() { return vndCreatedBy; }
    public void setVndCreatedBy(String vndCreatedBy) { this.vndCreatedBy = vndCreatedBy; }

    public LocalDateTime getVndCreatedOn() { return vndCreatedOn; }
    public void setVndCreatedOn(LocalDateTime vndCreatedOn) { this.vndCreatedOn = vndCreatedOn; }

    public String getVndModifiedBy() { return vndModifiedBy; }
    public void setVndModifiedBy(String vndModifiedBy) { this.vndModifiedBy = vndModifiedBy; }

    public LocalDateTime getVndModifiedOn() { return vndModifiedOn; }
    public void setVndModifiedOn(LocalDateTime vndModifiedOn) { this.vndModifiedOn = vndModifiedOn; }

}
