"use client";

import { ArchiveButton } from "@/components/ui/archive-button";

/** Antes "Borrar": ahora archiva o recupera la campaña (pregunta 20). */
export function DeleteCampaignButton({
  campaignId,
  campaignName,
  redirectTo,
  archived = false,
}: {
  campaignId: string;
  campaignName: string;
  redirectTo?: string;
  archived?: boolean;
}) {
  return (
    <ArchiveButton
      endpoint={`/api/campaigns/${campaignId}/archivo`}
      name={campaignName}
      archived={archived}
      kind="campaña"
      redirectTo={redirectTo}
    />
  );
}
