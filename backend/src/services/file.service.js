class FileService {
  toCsv(rows) {
    return Array.isArray(rows) ? rows.join("\n") : "";
  }

  csvEscape(value) {
    const text = String(value ?? "");
    if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
      return `"${text.replace(/\"/g, '""')}"`;
    }
    return text;
  }

  toZip(files) {
    return { files: Array.isArray(files) ? files.length : 0 };
  }
}

export const fileService = new FileService();
