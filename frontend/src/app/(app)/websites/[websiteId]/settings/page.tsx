import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWebsite } from "@/lib/api/websites";

import { DeleteWebsiteButton } from "./delete-website-button";

export const metadata: Metadata = { title: "Settings" };

export default async function WebsiteSettingsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;
  const website = await getWebsite(websiteId);

  return (
    <PageShell title="Settings" description="Manage this website.">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Website details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-xs font-medium text-muted">URL</p>
              <p className="text-foreground">{website.url}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Domain</p>
              <p className="text-foreground">{website.domain}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Added</p>
              <p className="text-foreground">{new Date(website.created_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-critical/30">
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Removing this website deletes it and all of its audit history permanently.
            </p>
            <div className="mt-4">
              <DeleteWebsiteButton websiteId={website.id} displayName={website.display_name} />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
