import { Action, ActionPanel, Form, Icon, Toast, popToRoot, showToast } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { useState } from "react";
import { createWorktree, launchInTerminal, slugify } from "./lib/worktree";

type Values = {
  taskName: string;
  branchName: string;
  command: string;
  repoRoot: string;
};

export default function NewSessionCommand() {
  const [taskName, setTaskName] = useState("");
  const [branchName, setBranchName] = useState("");

  async function handleSubmit(values: Values) {
    if (!values.taskName.trim()) {
      await showToast({ style: Toast.Style.Failure, title: "Task name is required" });
      return;
    }
    const toast = await showToast({ style: Toast.Style.Animated, title: "Creating worktree..." });
    try {
      const { worktreePath, branch } = await createWorktree({
        taskName: values.taskName,
        branchName: values.branchName || values.taskName,
        repoRoot: values.repoRoot || undefined,
      });
      toast.style = Toast.Style.Success;
      toast.title = `Worktree created`;
      toast.message = `${branch} at ${worktreePath}`;

      await launchInTerminal(worktreePath, values.command || "claude");
      await popToRoot();
    } catch (err) {
      await showFailureToast(err, { title: "Could not create worktree" });
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm icon={Icon.Rocket} title="Create & Launch" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description text="Create a new git worktree and launch Claude Code in your terminal." />
      <Form.TextField
        id="taskName"
        title="Task Name"
        placeholder="Refactor auth flow"
        value={taskName}
        onChange={(v) => {
          setTaskName(v);
          if (!branchName) setBranchName(slugify(v));
        }}
      />
      <Form.TextField
        id="branchName"
        title="Branch Slug"
        placeholder="refactor-auth-flow"
        value={branchName}
        onChange={setBranchName}
        info="Will become feat/<slug>. Auto-generated from task name."
      />
      <Form.TextField
        id="command"
        title="Command"
        placeholder="claude"
        defaultValue="claude"
        info="Command to run in the new terminal tab."
      />
      <Form.TextField
        id="repoRoot"
        title="Repo Root (optional)"
        placeholder="~/Developer/my-repo"
        info="Leave blank to auto-detect from current git repo."
      />
    </Form>
  );
}
