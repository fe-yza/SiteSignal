"use client";

import { useState, useTransition } from "react";

import { deleteWebsiteAction } from "@/app/(app)/websites/[websiteId]/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

export function DeleteWebsiteButton({
  websiteId,
  displayName,
}: {
  websiteId: string;
  displayName: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showError } = useToast();

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteWebsiteAction(websiteId);
      if (result?.error) {
        showError(result.error);
        setOpen(false);
      }
      // On success the action redirects, so no further state update happens here.
    });
  }

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Remove website
      </Button>
      <ConfirmDialog
        open={open}
        title={`Remove ${displayName}?`}
        description="This permanently deletes this website and every audit, page, and issue associated with it. This can't be undone."
        confirmLabel="Remove website"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
        loading={isPending}
      />
    </>
  );
}
