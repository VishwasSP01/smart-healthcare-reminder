package com.tekravio.healthcare.prescription;

import java.io.IOException;
import java.time.Duration;

import com.tekravio.healthcare.aws.AwsProperties;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

@Component
class S3PrescriptionStorage {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final AwsProperties properties;
    private final Duration urlTtl;
    private final PrescriptionOcrProperties ocrProperties;

    S3PrescriptionStorage(S3Client s3Client, S3Presigner s3Presigner, AwsProperties properties, Duration prescriptionUrlTtl, PrescriptionOcrProperties ocrProperties) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
        this.properties = properties;
        this.urlTtl = prescriptionUrlTtl;
        this.ocrProperties = ocrProperties;
    }

    void upload(String key, MultipartFile file) throws IOException {
        if ("mock".equalsIgnoreCase(ocrProperties.provider())) {
            // Bypass S3 upload for local mock testing
            return;
        }
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(properties.s3Bucket())
                .key(key)
                .contentType(file.getContentType())
                .contentLength(file.getSize())
                .build();
        s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
    }

    String presignedUrl(String key) {
        if ("mock".equalsIgnoreCase(ocrProperties.provider())) {
            // Return a beautiful unsplash image of medicine as a mock prescription image
            return "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800";
        }
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(properties.s3Bucket())
                .key(key)
                .build();
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(urlTtl)
                .getObjectRequest(getObjectRequest)
                .build();
        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }
}

