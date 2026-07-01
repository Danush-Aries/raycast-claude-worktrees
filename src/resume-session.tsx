import { Action, ActionPanel, Color, Icon, List, popToRoot } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { useEffect, useMemo, useState } from "react";
import { Worktree, launchInTerminal, listWorktrees, openInEditor } from "./lib/worktree";

export default function ResumeSessionCommand() {
  const [items, setItems] = useState<Worktree[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const wts = await listWorktrees();
        setItems(wts);
      } catch (err) {
        await showFailureToast(err, { title: "Could not list worktrees" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sorted = useMemo(
    () => [...items].sort((a, b) => (a.ageDays ?? 999) - (b.ageDays ?? 999)),
    [items],
  );

  if (!loading && sorted.length === 0) {
    return (
      <List>
        <List.EmptyView icon={Icon.Clock} title="No recent sessions" description="Create one via 'New Session'." />
      </List>
    );
  }

  return (
    <List isLoading={loading} searchBarPlaceholder="Search recent sessions">
      {sorted.map((wt) => (
        <List.Item
          key={wt.path}
          icon={{ source: Icon.Play, tintColor: Color.Green }}
          title={wt.branch}
          subtitle={wt.lastCommitMessage || wt.path}
          accessories={[{ text: wt.ageDays === 0 ? "today" : `${wt.ageDays}d ago` }]}
          actions={
            <ActionPanel>
              <Action
                icon={Icon.Rocket}
                title="Resume in Terminal"
                onAction={async () => {
                  try {
                    await launchInTerminal(wt.path);
                    await popToRoot();
                  } catch (err) {
                    await showFailureToast(err, { title: "Launch failed" });
                  }
                }}
              />
              <Action
                icon={Icon.Code}
                title="Open in Cursor"
                onAction={() => openInEditor(wt.path, "cursor").catch((e) => showFailureToast(e))}
              />
              <Action.CopyToClipboard title="Copy Path" content={wt.path} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
