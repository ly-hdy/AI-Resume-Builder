export interface JobDescriptionData {
  schemaVersion: "1.0";
  id: string;
  resumeId: string;
  source: "text" | "image" | "file";
  createdAt: string;
  updatedAt: string;
  rawText: string;
  jobTitle: string;
  company?: string;
  location?: string;
  salary?: string;
  responsibilities: string[];
  requirements: string[];
  preferredQualifications: string[];
  keywords: string[];
  analysis?: {
    roleSummary: string;
    coreSkills: string[];
    valuedAbilities: string[];
    resumeFocus: string[];
  };
  parsedConfidence: number;
}
