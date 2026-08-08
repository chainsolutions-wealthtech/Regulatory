export type GenerationArtifactSummary = {
  generationId: string;
  fileName: string;
  documentType: string;
  mediaType: string;
  sha256: string;
  byteSize: number;
};

export type GenerationArtifactContent = GenerationArtifactSummary & {
  content: Buffer;
};
