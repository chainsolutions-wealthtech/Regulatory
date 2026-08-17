import "server-only";

import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { inflateRawSync } from "node:zlib";
import { createDeterministicProspectusTextExtractor } from "@/server/import/deterministic-prospectus-text-extractor";
import type { ProspectusExtractionProposal, ProspectusExtractor } from "@/server/import/prospectus-import-service";

const execFileAsync = promisify(execFile);

const PDF_MEDIA_TYPE = "application/pdf";
const DOCX_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_SOURCE_BYTES = 50 * 1024 * 1024;
const MAX_DOCUMENT_XML_BYTES = 10 * 1024 * 1024;
const MAX_PDF_TEXT_BYTES = 10 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 10_000;

export type PdfTextPage = {
  page: number;
  text: string;
};

export type PdfTextProvider = (input: {
  fileName: string;
  content: Uint8Array;
}) => Promise<PdfTextPage[]>;

export function createBinaryProspectusExtractor(input: {
  pdfTextProvider?: PdfTextProvider;
} = {}): ProspectusExtractor {
  const textExtractor = createDeterministicProspectusTextExtractor();
  const pdfTextProvider = input.pdfTextProvider ?? extractPdfTextWithPdftotext;

  return {
    id: "deterministic-binary-prospectus-extractor",
    version: "1.0.0",
    async extract(document) {
      assertSourceSize(document.content);

      if (document.mediaType === DOCX_MEDIA_TYPE) {
        const text = extractDocxText(document.content);
        return textExtractor.extractText({ text });
      }

      if (document.mediaType === PDF_MEDIA_TYPE) {
        const pages = await pdfTextProvider({
          fileName: document.fileName,
          content: document.content,
        });
        return deduplicateProposals(
          pages.flatMap((page) => {
            if (!Number.isInteger(page.page) || page.page < 1) {
              throw new Error("IMPORT_PDF_PAGE_NUMBER_INVALID");
            }
            return textExtractor.extractText({ text: page.text, page: page.page });
          }),
        );
      }

      throw new Error(`IMPORT_UNSUPPORTED_MEDIA_TYPE:${document.mediaType}`);
    },
  };
}

export function extractDocxText(content: Uint8Array): string {
  assertSourceSize(content);
  const archive = Buffer.from(content.buffer, content.byteOffset, content.byteLength);
  const entry = findZipEntry(archive, "word/document.xml");
  if (!entry) throw new Error("IMPORT_DOCX_DOCUMENT_XML_MISSING");
  if (entry.uncompressedSize > MAX_DOCUMENT_XML_BYTES) {
    throw new Error("IMPORT_DOCX_DOCUMENT_XML_TOO_LARGE");
  }

  const compressed = archive.subarray(entry.dataOffset, entry.dataOffset + entry.compressedSize);
  let xml: Buffer;
  if (entry.compressionMethod === 0) {
    xml = Buffer.from(compressed);
  } else if (entry.compressionMethod === 8) {
    xml = inflateRawSync(compressed, { maxOutputLength: MAX_DOCUMENT_XML_BYTES });
  } else {
    throw new Error(`IMPORT_DOCX_UNSUPPORTED_COMPRESSION:${entry.compressionMethod}`);
  }
  if (xml.length > MAX_DOCUMENT_XML_BYTES) throw new Error("IMPORT_DOCX_DOCUMENT_XML_TOO_LARGE");

  return docxXmlToText(xml.toString("utf8"));
}

export async function extractPdfTextWithPdftotext(input: {
  fileName: string;
  content: Uint8Array;
}): Promise<PdfTextPage[]> {
  assertSourceSize(input.content);
  const directory = await mkdtemp(path.join(tmpdir(), "regulatory-prospectus-"));
  const inputPath = path.join(directory, safeTemporaryName(input.fileName, ".pdf"));
  const outputPath = path.join(directory, "prospectus.txt");

  try {
    await writeFile(inputPath, input.content);
    try {
      await execFileAsync(
        "pdftotext",
        ["-layout", "-enc", "UTF-8", inputPath, outputPath],
        {
          timeout: 20_000,
          maxBuffer: 1024 * 1024,
          windowsHide: true,
        },
      );
    } catch (error) {
      const code = readErrorCode(error);
      if (code === "ENOENT") throw new Error("IMPORT_PDF_TEXT_EXTRACTOR_UNAVAILABLE");
      if (code === "ETIMEDOUT") throw new Error("IMPORT_PDF_TEXT_EXTRACTION_TIMEOUT");
      throw new Error("IMPORT_PDF_TEXT_EXTRACTION_FAILED");
    }

    const text = await readFile(outputPath, "utf8");
    if (Buffer.byteLength(text, "utf8") > MAX_PDF_TEXT_BYTES) {
      throw new Error("IMPORT_PDF_TEXT_TOO_LARGE");
    }

    return text
      .split("\f")
      .map((pageText, index) => ({ page: index + 1, text: pageText.trim() }))
      .filter((page) => page.text.length > 0);
  } finally {
    await rm(directory, { recursive: true, force: true }).catch(() => undefined);
  }
}

type ZipEntry = {
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  dataOffset: number;
};

function findZipEntry(archive: Buffer, targetName: string): ZipEntry | null {
  const eocdOffset = findEndOfCentralDirectory(archive);
  const entryCount = archive.readUInt16LE(eocdOffset + 10);
  const centralDirectorySize = archive.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = archive.readUInt32LE(eocdOffset + 16);
  if (entryCount > MAX_ZIP_ENTRIES) throw new Error("IMPORT_DOCX_TOO_MANY_ZIP_ENTRIES");
  if (centralDirectoryOffset + centralDirectorySize > archive.length) {
    throw new Error("IMPORT_DOCX_INVALID_CENTRAL_DIRECTORY");
  }

  let offset = centralDirectoryOffset;
  for (let index = 0; index < entryCount; index += 1) {
    ensureRange(archive, offset, 46, "IMPORT_DOCX_INVALID_CENTRAL_ENTRY");
    if (archive.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("IMPORT_DOCX_INVALID_CENTRAL_ENTRY");
    }

    const compressionMethod = archive.readUInt16LE(offset + 10);
    const compressedSize = archive.readUInt32LE(offset + 20);
    const uncompressedSize = archive.readUInt32LE(offset + 24);
    const fileNameLength = archive.readUInt16LE(offset + 28);
    const extraLength = archive.readUInt16LE(offset + 30);
    const commentLength = archive.readUInt16LE(offset + 32);
    const localHeaderOffset = archive.readUInt32LE(offset + 42);
    ensureRange(archive, offset + 46, fileNameLength, "IMPORT_DOCX_INVALID_CENTRAL_ENTRY");
    const fileName = archive.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8");

    if (fileName === targetName) {
      ensureRange(archive, localHeaderOffset, 30, "IMPORT_DOCX_INVALID_LOCAL_ENTRY");
      if (archive.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
        throw new Error("IMPORT_DOCX_INVALID_LOCAL_ENTRY");
      }
      const localNameLength = archive.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = archive.readUInt16LE(localHeaderOffset + 28);
      const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
      ensureRange(archive, dataOffset, compressedSize, "IMPORT_DOCX_TRUNCATED_ENTRY");
      return { compressionMethod, compressedSize, uncompressedSize, dataOffset };
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  return null;
}

function findEndOfCentralDirectory(archive: Buffer): number {
  const minimum = Math.max(0, archive.length - 65_557);
  for (let offset = archive.length - 22; offset >= minimum; offset -= 1) {
    if (archive.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  throw new Error("IMPORT_DOCX_INVALID_ZIP");
}

function docxXmlToText(xml: string): string {
  return decodeXmlEntities(
    xml
      .replace(/<w:tab\s*\/>/giu, "\t")
      .replace(/<w:(?:br|cr)\s*\/>/giu, "\n")
      .replace(/<\/w:p>/giu, "\n")
      .replace(/<[^>]+>/gu, ""),
  )
    .replace(/[\t ]+\n/gu, "\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/gu, "<")
    .replace(/&gt;/gu, ">")
    .replace(/&quot;/gu, '"')
    .replace(/&apos;/gu, "'")
    .replace(/&amp;/gu, "&")
    .replace(/&#(\d+);/gu, (_match, decimal: string) => String.fromCodePoint(Number(decimal)))
    .replace(/&#x([0-9a-f]+);/giu, (_match, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)));
}

function deduplicateProposals(proposals: ProspectusExtractionProposal[]): ProspectusExtractionProposal[] {
  const byField = new Map<string, ProspectusExtractionProposal[]>();
  for (const proposal of proposals) {
    const list = byField.get(proposal.proposedCanonicalFieldPath) ?? [];
    list.push(proposal);
    byField.set(proposal.proposedCanonicalFieldPath, list);
  }

  const result: ProspectusExtractionProposal[] = [];
  for (const list of byField.values()) {
    const normalizedValues = new Set(list.map((proposal) => JSON.stringify(proposal.extractedValue)));
    if (normalizedValues.size !== 1) continue;
    result.push(list[0]);
  }
  return result;
}

function assertSourceSize(content: Uint8Array): void {
  if (content.byteLength === 0) throw new Error("IMPORT_SOURCE_EMPTY");
  if (content.byteLength > MAX_SOURCE_BYTES) throw new Error("IMPORT_SOURCE_TOO_LARGE");
}

function ensureRange(buffer: Buffer, offset: number, length: number, errorCode: string): void {
  if (offset < 0 || length < 0 || offset + length > buffer.length) throw new Error(errorCode);
}

function safeTemporaryName(fileName: string, fallbackExtension: string): string {
  const base = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/gu, "_").slice(0, 120);
  return base.toLowerCase().endsWith(fallbackExtension) ? base : `prospectus${fallbackExtension}`;
}

function readErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}
