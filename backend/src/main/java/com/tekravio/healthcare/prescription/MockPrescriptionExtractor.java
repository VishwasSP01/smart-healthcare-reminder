package com.tekravio.healthcare.prescription;

import java.math.BigDecimal;
import java.util.List;

import com.tekravio.healthcare.prescription.dto.MedicineCandidate;

import org.springframework.stereotype.Component;

@Component
class MockPrescriptionExtractor implements PrescriptionOcrProvider {

    @Override
    public String providerName() {
        return "mock";
    }

    @Override
    public OcrExtractionResult extract(String bucket, String key, String contentType) {
        // Prepare some sample candidates to demonstrate the system
        List<MedicineCandidate> candidates = List.of(
                new MedicineCandidate("Amoxicillin", "500 mg", "THRICE_DAILY", "7 days", BigDecimal.valueOf(98.5)),
                new MedicineCandidate("Paracetamol", "650 mg", "TWICE_DAILY", "3 days", BigDecimal.valueOf(62.0)), // low confidence (<70%) triggers manual review
                new MedicineCandidate("Atorvastatin", "10 mg", "ONCE_DAILY", "30 days", BigDecimal.valueOf(95.0))
        );

        String rawText = """
                Dr. Smith's Wellness Center
                Reg No: 12345/A
                
                Patient: John Doe, Age: 35
                Date: June 7, 2026
                
                Rx:
                1. Tab. Amoxicillin 500mg - 1 tab thrice daily (tds) for 7 days
                2. Tab. Paracetamol 650mg - 1 tab twice daily (bd) for 3 days as needed
                3. Tab. Atorvastatin 10mg - 1 tab once daily (od) at night for 30 days
                
                Signature: Dr. Smith
                """;

        // If any candidate has confidence < 70% or list is empty, trigger manual review
        boolean lowConfidence = candidates.stream()
                .anyMatch(c -> c.confidence() != null && c.confidence().doubleValue() < 70.0);

        return new OcrExtractionResult("mock", rawText, candidates, lowConfidence);
    }
}
