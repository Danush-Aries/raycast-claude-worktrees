import { Action, ActionPanel, Alert, Color, Icon, List, Toast, confirmAlert, showToast } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { useEffect, useState } from "react";
import { Worktree, launchInTerminal, listWorktrees, openInEditor, removeWorktree } from "./lib/worktree";

export default function ListSessionsCommand() {
  const [items, setItems] = useState<Worktree[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const wts = await listWorktrees();
      setItems(wts);
    } catch (err) {
      await showFailureToast(err, { title: "Could not list worktrees" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDelete(wt: Worktree) {
    const confirmed = await confirmAlert({
      title: "Remove worktree?",
      message: `${wt.path}\nBranch: ${wt.branch}\n\nThis calls 'git worktree remove --force'.`,
      primaryAction: { title: "Remove", style: Alert.ActionStyle.Destructive },
    });
    if (!confirmed) return;
    const toast = await showToast({ style: Toast.Style.Animated, title: "Removing..." });
    try {
      await removeWorktree(wt.path);
      toast.style = Toast.Style.Success;
      toast.title = "Removed";
      await refresh();
    } catch (err) {
      await showFailureToast(err, { title: "Remove failed" });
    }
  }

  if (!loading && items.length === 0) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.Tree}
          title="No worktrees yet"
          description="Run 'New Session' to create your first parallel Claude session."
        />
      </List>
    );
  }

  return (
    <List isLoading={loading} searchBarPlaceholder="Filter worktrees by path or branch">
      {items.map((wt) => (
        <List.Item
          key={wt.path}
          icon={ageIcon(wt.ageDays)}
          title={displayName(wt.path)}
          subtitle={wt.branch}
          accessories={[
            { text: wt.ageDays === 0 ? "today" : `${wt.ageDays}d` },
            wt.locked ? { tag: { value: "locked", color: Color.Yellow } } : {},
            wt.prunable ? { tag: { value: "prunable", color: Color.Red } } : {},
          ]}
          actions={
            <ActionPanel>
              <Action
                icon={Icon.Rocket}
                title="Open in Terminal & Run Claude"
                onAction={async () => {
                  try {
                    await launchInTerminal(wt.path);
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
              <Action
                icon={Icon.Code}
                title="Open in VS Code"
                onAction={() => openInEditor(wt.path, "code").catch((e) => showFailureToast(e))}
              />
              <Action
                icon={Icon.Finder}
                title="Reveal in Finder"
                onAction={() => openInEditor(wt.path, "finder").catch((e) => showFailureToast(e))}
              />
              <Action.CopyToClipboard title="Copy Path" content={wt.path} />
              <Action.CopyToClipboard title="Copy Branch" content={wt.branch} />
              <ActionPanel.Section>
                <Action
                  icon={Icon.Trash}
                  title="Delete Worktree"
                  style={Action.Style.Destructive}
                  shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                  onAction={() => handleDelete(wt)}
                />
                <Action
                  icon={Icon.ArrowClockwise}
                  title="Refresh"
                  shortcut={{ modifiers: ["cmd"], key: "r" }}
                  onAction={refresh}
                />
              </ActionPanel.Section>
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

function displayName(p: string): string {
  return p.replace(process.env.HOME || "", "~");
}

function ageIcon(days: number) {
  if (days <= 1) return { source: Icon.Circle, tintColor: Color.Green };
  if (days <= 7) return { source: Icon.Circle, tintColor: Color.Blue };
  if (days <= 14) return { source: Icon.Circle, tintColor: Color.Yellow };
  return { source: Icon.Circle, tintColor: Color.Red };
}
