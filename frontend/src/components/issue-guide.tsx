import { ISSUE_GUIDES } from "@/lib/issue-guidance";

export function IssueGuide({ type }: { type: string }) {
  const guide = ISSUE_GUIDES[type];
  if (!guide) return <p className="mt-3 text-sm text-muted">Review the recorded recommendation, publish the change, and run a new audit to verify it.</p>;
  return (
    <div className="mt-4 space-y-4 text-sm">
      <p><strong>Where to edit: </strong>{guide.where}</p>
      <div>
        <h4 className="font-semibold">How to fix it</h4>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-muted-foreground">
          {guide.steps.map(step => <li key={step}>{step}</li>)}
        </ol>
      </div>
      {guide.note && <p className="border-l-2 border-accent pl-3 text-muted-foreground">{guide.note}</p>}
      <p><strong>Check your fix: </strong>{guide.verify}</p>
      {guide.source && <a href={guide.source} target="_blank" rel="noopener noreferrer" className="inline-block text-accent underline underline-offset-4">Google Search Central guidance ↗</a>}
    </div>
  );
}
