package com.caits.modules.transactions;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DocTypeTest {

    @Test
    void seriesPrefixes() {
        assertEquals("GRN", DocType.GRN.seriesPrefix());
        assertEquals("OST", DocType.OPENING_STOCK.seriesPrefix());
        assertEquals("STRQ", DocType.MATERIAL_REQUISITION.seriesPrefix());
        assertEquals("STIS", DocType.MATERIAL_ISSUE.seriesPrefix());
        assertEquals("MTRF", DocType.MATERIAL_TRANSFER.seriesPrefix());
        assertEquals("MRET", DocType.MATERIAL_RETURN.seriesPrefix());
        assertEquals("GPI", DocType.GATEPASS_INWARD.seriesPrefix());
        assertEquals("GPO", DocType.GATEPASS_OUTWARD.seriesPrefix());
    }

    @Test
    void fromCodeIsCaseInsensitive() {
        assertEquals(DocType.GRN, DocType.fromCode("grn"));
        assertEquals(DocType.OPENING_STOCK, DocType.fromCode("OPENING_STOCK"));
        assertThrows(IllegalArgumentException.class, () -> DocType.fromCode("UNKNOWN"));
    }
}
