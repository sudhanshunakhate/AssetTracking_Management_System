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

    /**
     * Documents and images are accepted. Executables and script files are rejected.
     */
    private static final Set<String> BLOCKED_EXTENSIONS = Set.of(
            "exe", "bat", "cmd", "com", "scr", "pif", "msi", "msp",
            "js", "mjs", "vbs", "vbe", "ps1", "sh", "bash", "dll",
            "jar", "war", "apk", "app", "dmg", "hta", "wsf", "cpl",
            "msc", "reg", "inf", "lnk", "gadget"
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
        if (ext == null || ext.isBlank()) {
            ext = extensionFromContentType(file.getContentType());
        }
        if (ext == null || ext.isBlank()) {
            ext = "bin";
        }
        ext = ext.toLowerCase(Locale.ROOT);
        if (BLOCKED_EXTENSIONS.contains(ext)) {
            throw ApiException.badRequest("This file type cannot be attached. Use a document or image.");
        }

        String relativeDir = LocalDate.now().format(FOLDER);
        String storedName = UUID.randomUUID() + "." + ext;
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

    private static String extensionFromContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return null;
        }
        String mime = contentType.split(";", 2)[0].trim().toLowerCase(Locale.ROOT);
        return switch (mime) {
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            case "image/gif" -> "gif";
            case "image/webp" -> "webp";
            case "image/bmp" -> "bmp";
            case "image/svg+xml" -> "svg";
            case "image/tiff" -> "tiff";
            case "application/pdf" -> "pdf";
            case "text/plain" -> "txt";
            case "text/csv" -> "csv";
            case "application/zip" -> "zip";
            case "application/msword" -> "doc";
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> "docx";
            case "application/vnd.ms-excel" -> "xls";
            case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" -> "xlsx";
            case "application/vnd.ms-powerpoint" -> "ppt";
            case "application/vnd.openxmlformats-officedocument.presentationml.presentation" -> "pptx";
            default -> null;
        };
    }
}
