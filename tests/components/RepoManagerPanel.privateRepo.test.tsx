import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RepoManagerPanel } from "@/components/skills/RepoManagerPanel";

describe("RepoManagerPanel private GitHub repository support", () => {
  it("submits an optional PAT without exposing it as plain text", async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <RepoManagerPanel
        repos={[]}
        skills={[]}
        onAdd={onAdd}
        onRemove={vi.fn().mockResolvedValue(undefined)}
        onClose={vi.fn()}
      />,
    );

    await user.type(
      screen.getByLabelText("skills.repo.url"),
      "https://github.com/weihaostudio/agent-skills",
    );
    await user.type(screen.getByLabelText("skills.repo.branch"), "main");

    const tokenInput = screen.getByLabelText("skills.repo.accessToken");
    expect(tokenInput).toHaveAttribute("type", "password");
    await user.type(tokenInput, "github_pat_example");

    await user.click(screen.getByRole("button", { name: "skills.repo.add" }));

    expect(onAdd).toHaveBeenCalledWith({
      owner: "weihaostudio",
      name: "agent-skills",
      branch: "main",
      accessToken: "github_pat_example",
      enabled: true,
    });
  });
});
