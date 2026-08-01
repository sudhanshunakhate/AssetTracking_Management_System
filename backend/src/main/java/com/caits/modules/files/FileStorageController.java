package com.caits.modules.files;

import com.caits.common.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLConnection;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Local-disk attachment storage for transaction documents.
 * Uploads land in {@code caits.storage.upload-dir} under a yyyy/MM folder and are
 * served back by name; the returned {@code url} is what callers persist
 * (e.g. txn_header_mst.txh_attachment_url).
 */
@RestController
@RequestMapping("/api/v1/files")
public class FileStorageController {

    /** Extensions accepted for attachments — anything executable is rejected. */
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "png", "jpg", "jpeg", "gif", "webp", "txt", "csv",
            "doc", "docx", "xls", "xlsx", "ppt", "pptx", "zip"
    );

    private static final DateTimeFormatter FOLDER = DateTimeFormatter.ofPattern("yyyy/MM");

    private final Path root;

    public FileStorageController(@Value("${caits.storage.upload-dir}") String uploadDir) {
        this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public record UploadResponse(String url, String fileName, String originalName, long size, String message) {}

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploadResponse upload(@RequestPart("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("File is required");
        }
        String original = StringUtils.cleanPath(
                file.getOriginalFilename() == null ? "attachment" : file.getOriginalFilename());
        String ext = StringUtils.getFilenameExtension(original);
        if (ext == null || !ALLOWED_EXTENSIONS.contains(ext.toLowerCase(Locale.ROOT))) {
            throw ApiException.badRequest("Unsupported file type. Allowed: " + String.join(", ", ALLOWED_EXTENSIONS));
        }

        String relativeDir = LocalDate.now().format(FOLDER);
        String storedName = UUID.randomUUID() + "." + ext.toLowerCase(Locale.ROOT);
        Path target = root.resolve(relativeDir).resolve(storedName).normalize();
        if (!target.startsWith(root)) {
            throw ApiException.badRequest("Invalid file path");
        }

        try {
            Files.createDirectories(target.getParent());
            file.transferTo(target);
        } catch (IOException e) {
            throw ApiException.badRequest("Could not store file: " + e.getMessage());
        }

        String key = relativeDir + "/" + storedName;
        return new UploadResponse("/api/v1/files/" + key, key, original, file.getSize(), "File uploaded successfully");
    }

    @GetMapping("/{year}/{month}/{name}")
    public ResponseEntity<Resource> download(
            @PathVariable String year,
            @PathVariable String month,
            @PathVariable String name
    ) {
        Path target = root.resolve(year).resolve(month).resolve(name).normalize();
        if (!target.startsWith(root) || !Files.isReadable(target)) {
            throw ApiException.notFound("File not found");
        }
        String contentType = URLConnection.guessContentTypeFromName(name);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType != null ? contentType : MediaType.APPLICATION_OCTET_STREAM_VALUE))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + name + "\"")
                .body(new FileSystemResource(target));
    }
}
