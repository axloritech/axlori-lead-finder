import { NextResponse } from "next/server";
import { APP } from "@/lib/constants";
import { getProviderMetaSummary } from "@/lib/services";

export const runtime = "nodejs";

/** Reports which providers are active — used by the Settings screen and monitoring. */
export async function GET() {
  const { config, providers } = getProviderMetaSummary();
  return NextResponse.json({
    ok: true,
    app: APP.name,
    version: APP.version,
    demoMode: config.demoMode,
    providers,
  });
}
