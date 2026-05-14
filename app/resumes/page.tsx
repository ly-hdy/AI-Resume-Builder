import ResumesClient, { type ResumeFilter } from "./resumes-client";

export default function ResumesPage({
  searchParams
}: {
  searchParams?: { source?: string };
}) {
  const filter: ResumeFilter =
    searchParams?.source === "manual" || searchParams?.source === "upload"
      ? searchParams.source
      : "all";

  return <ResumesClient filter={filter} />;
}
