import { Action, ActionPanel, Form, Icon, Toast, showToast } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { execa } from "execa";
import { useEffect, useState } from "react";
import { Worktree, listWorktrees } from "./lib/worktree";

export default function DiffWorktreesCommand() {
  const [items, setItems] = useState<Worktree[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setItems(await listWorktrees());
      } catch (err) {
        await showFailureToast(err, { title: "Could not list worktrees" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSubmit(values: { a: string; b: string }) {
    if (!values.a || !values.b || values.a === values.b) {
      await showToast({ style: Toast.Style.Failure, title: "Pick two different worktrees" });
      return;
    }
    const toast = await showToast({ style: Toast.Style.Animated, title: "Running diff..." });
    try {
      const cmd = `diff -r --brief '${values.a.replace(/'/g, "'\\''")}' '${values.b.replace(/'/g, "'\\''")}'; echo; echo '--- Press any key to close ---'; read -n 1`;
      const script = `
        tell application "Terminal"
          activate
          do script "${cmd.replace(/"/g, '\\"')}"
        end tell
      `;
      await execa("osascript", ["-e", script]);
      toast.style = Toast.Style.Success;
      toast.title = "Diff opened in Terminal";
    } catch (err) {
      await showFailureToast(err, { title: "Diff failed" });
    }
  }

  return (
    <Form
      isLoading={loading}
      actions={
        <ActionPanel>
          <Action.SubmitForm icon={Icon.MagnifyingGlass} title="Diff in Terminal" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description text="Compare two worktrees with 'diff -r --brief' in a new Terminal window." />
      <Form.Dropdown id="a" title="Worktree A">
        {items.map((wt) => (
          <Form.Dropdown.Item key={wt.path} value={wt.path} title={`${wt.branch}  (${displayName(wt.path)})`} />
        ))}
      </Form.Dropdown>
      <Form.Dropdown id="b" title="Worktree B">
        {items.map((wt) => (
          <Form.Dropdown.Item key={wt.path} value={wt.path} title={`${wt.branch}  (${displayName(wt.path)})`} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}

function displayName(p: string): string {
  return p.replace(process.env.HOME || "", "~");
}
