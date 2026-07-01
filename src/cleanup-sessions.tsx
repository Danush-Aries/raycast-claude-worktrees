import { Action, ActionPanel, Alert, Color, Form, Icon, List, Toast, confirmAlert, popToRoot, showToast, useNavigation } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { useEffect, useState } from "react";
import { Worktree, listWorktrees, removeWorktree } from "./lib/worktree";

type Threshold = "7" | "14" | "30";

export default function CleanupSessionsCommand() {
  const { push } = useNavigation();
  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            icon={Icon.MagnifyingGlass}
            title="Preview Cleanup"
            onSubmit={async (values: { threshold: Threshold }) => {
              try {
                const all = await listWorktrees();
                const days = parseInt(values.threshold, 10);
                const targets = all.filter((w) => w.ageDays >= days && !w.locked);
                push(<PreviewList targets={targets} days={days} />);
              } catch (err) {
                await showFailureToast(err, { title: "Could not list worktrees" });
              }
            }}
          />
        </ActionPanel>
      }
    >
      <Form.Description text="Preview and remove worktrees older than a threshold." />
      <Form.Dropdown id="threshold" title="Older than" defaultValue="7">
        <Form.Dropdown.Item value="7" title="7 days" />
        <Form.Dropdown.Item value="14" title="14 days" />
        <Form.Dropdown.Item value="30" title="30 days" />
      </Form.Dropdown>
    </Form>
  );
}

function PreviewList({ targets, days }: { targets: Worktree[]; days: number }) {
  const [items, setItems] = useState<Worktree[]>(targets);
  const [busy, setBusy] = useState(false);

  useEffect(() => setItems(targets), [targets]);

  async function nukeAll() {
    const confirmed = await confirmAlert({
      title: `Remove ${items.length} worktree(s)?`,
      message: "This runs 'git worktree remove --force' for each. Unpushed commits will be lost.",
      primaryAction: { title: "Remove All", style: Alert.ActionStyle.Destructive },
    });
    if (!confirmed) return;
    setBusy(true);
    const toast = await showToast({ style: Toast.Style.Animated, title: "Cleaning up..." });
    let ok = 0;
    let fail = 0;
    for (const wt of items) {
      try {
        await removeWorktree(wt.path);
        ok++;
      } catch {
        fail++;
      }
    }
    toast.style = fail === 0 ? Toast.Style.Success : Toast.Style.Failure;
    toast.title = `Removed ${ok}, failed ${fail}`;
    setBusy(false);
    await popToRoot();
  }

  if (items.length === 0) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.CheckCircle}
          title="Nothing to clean"
          description={`No worktrees older than ${days} days.`}
        />
      </List>
    );
  }

  return (
    <List
      isLoading={busy}
      searchBarPlaceholder={`Preview: ${items.length} worktrees older than ${days}d`}
      actions={
        <ActionPanel>
          <Action
            icon={Icon.Trash}
            title={`Remove All (${items.length})`}
            style={Action.Style.Destructive}
            onAction={nukeAll}
          />
        </ActionPanel>
      }
    >
      {items.map((wt) => (
        <List.Item
          key={wt.path}
          icon={{ source: Icon.Trash, tintColor: Color.Red }}
          title={wt.path.replace(process.env.HOME || "", "~")}
          subtitle={wt.branch}
          accessories={[{ text: `${wt.ageDays}d` }]}
          actions={
            <ActionPanel>
              <Action
                icon={Icon.Trash}
                title={`Remove All (${items.length})`}
                style={Action.Style.Destructive}
                onAction={nukeAll}
              />
              <Action
                icon={Icon.XMarkCircle}
                title="Skip This One"
                onAction={() => setItems((prev) => prev.filter((x) => x.path !== wt.path))}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
