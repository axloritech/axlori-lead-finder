import { redirect } from "next/navigation";
import { FindResults } from "@/components/find-results";
import { parseQuery, type RawParams } from "@/lib/search-params";
import { businessSearchService } from "@/lib/services";
import { AppError } from "@/lib/config";
import type { SearchResponse } from "@/lib/types";

export const metadata = {
  title: "Find businesses",
};

export const dynamic = "force-dynamic";

/**
 * /find — URL-driven results, rendered on the server.
 *
 * The query lives in the URL (term, location, radius, sort, filters, page) so
 * results are shareable, refresh-safe and navigable with the back button. The
 * provider call happens here, which means provider keys never reach the browser
 * and the first paint already contains real data.
 */
export default async function FindPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const params = await searchParams;
  const query = parseQuery(params);

  if (!query.term || !query.location) redirect("/");

  let data: SearchResponse | null = null;
  let error: { code: string; message: string; hint?: string } | null = null;

  try {
    data = await businessSearchService.search({ ...query, term: query.term, location: query.location });
  } catch (caught) {
    error =
      caught instanceof AppError
        ? caught.toShape()
        : {
            code: "unknown",
            message: "Something went wrong while searching.",
            hint: caught instanceof Error ? caught.message : undefined,
          };
  }

  return (
    <FindResults
      initialQuery={{ ...query, term: query.term, location: query.location }}
      initialData={data}
      initialError={error}
    />
  );
}
