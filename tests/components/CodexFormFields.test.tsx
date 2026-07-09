import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FormProvider, useForm } from "react-hook-form";
import { CodexFormFields } from "@/components/providers/forms/CodexFormFields";
import type { CodexDefaultReasoningEffort } from "@/types";

vi.mock("@/components/ui/collapsible", () => ({
  Collapsible: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CollapsibleTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

const noop = () => {};

function CodexFormFieldsHarness(
  props: React.ComponentProps<typeof CodexFormFields>,
) {
  const form = useForm({
    defaultValues: {
      localProxyRequestOverrides: { headers: "", body: "" },
    },
  });

  return (
    <FormProvider {...form}>
      <CodexFormFields {...props} />
    </FormProvider>
  );
}

function renderCodexFormFields(
  overrides: Partial<React.ComponentProps<typeof CodexFormFields>> = {},
) {
  const props: React.ComponentProps<typeof CodexFormFields> = {
    codexApiKey: "",
    onApiKeyChange: noop,
    category: "custom",
    shouldShowApiKeyLink: false,
    websiteUrl: "",
    shouldShowSpeedTest: false,
    codexBaseUrl: "https://example.test/v1",
    onBaseUrlChange: noop,
    isFullUrl: false,
    onFullUrlChange: noop,
    isEndpointModalOpen: false,
    onEndpointModalToggle: noop,
    autoSelect: false,
    onAutoSelectChange: noop,
    apiFormat: "openai_responses",
    onApiFormatChange: noop,
    speedTestEndpoints: [],
    customUserAgent: "",
    onCustomUserAgentChange: noop,
    localProxyHeadersOverride: "",
    onLocalProxyHeadersOverrideChange: noop,
    localProxyBodyOverride: "",
    onLocalProxyBodyOverrideChange: noop,
    ...overrides,
  };

  return render(<CodexFormFieldsHarness {...props} />);
}

describe("CodexFormFields", () => {
  it("allows changing the Codex default reasoning effort", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(value: CodexDefaultReasoningEffort) => void>();

    renderCodexFormFields({
      codexDefaultReasoningEffort: "high",
      onCodexDefaultReasoningEffortChange: onChange,
    });

    await user.click(screen.getByRole("combobox", { name: "默认推理级别" }));
    await user.click(await screen.findByRole("option", { name: "Medium" }));

    expect(onChange).toHaveBeenCalledWith("medium");
  });

  it("allows changing the Codex default model", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(value: string) => void>();

    renderCodexFormFields({
      codexDefaultModel: "glm-5.2",
      onCodexDefaultModelChange: onChange,
      catalogModels: [
        { model: "glm-5.2", displayName: "GLM 5.2" },
        { model: "deepseek-v4-pro", displayName: "DeepSeek V4 Pro" },
      ],
      onCatalogModelsChange: vi.fn(),
    });

    await user.click(screen.getByRole("combobox", { name: "默认模型" }));
    await user.click(
      await screen.findByRole("option", { name: "deepseek-v4-pro" }),
    );

    expect(onChange).toHaveBeenCalledWith("deepseek-v4-pro");
  });
});
