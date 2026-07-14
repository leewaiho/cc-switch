import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps, PropsWithChildren } from "react";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CodexFormFields } from "@/components/providers/forms/CodexFormFields";
import { Form } from "@/components/ui/form";
import { fetchModelsForConfig } from "@/lib/api/model-fetch";

vi.mock("@/lib/api/model-fetch", () => ({
  fetchModelsForConfig: vi.fn(),
  showFetchModelsError: vi.fn(),
}));

const FormShell = ({ children }: PropsWithChildren) => {
  const form = useForm();

  return <Form {...form}>{children}</Form>;
};

const renderCodexForm = (
  overrides: Partial<ComponentProps<typeof CodexFormFields>> = {},
) => {
  const props: ComponentProps<typeof CodexFormFields> = {
    codexApiKey: "",
    onApiKeyChange: vi.fn(),
    category: "custom",
    shouldShowApiKeyLink: false,
    websiteUrl: "",
    shouldShowSpeedTest: false,
    codexBaseUrl: "",
    onBaseUrlChange: vi.fn(),
    isFullUrl: false,
    onFullUrlChange: vi.fn(),
    isEndpointModalOpen: false,
    onEndpointModalToggle: vi.fn(),
    autoSelect: false,
    onAutoSelectChange: vi.fn(),
    apiFormat: "openai_chat",
    onApiFormatChange: vi.fn(),
    anthropicAuthField: "ANTHROPIC_API_KEY",
    onAnthropicAuthFieldChange: vi.fn(),
    impersonateClaudeCode: false,
    onImpersonateClaudeCodeChange: vi.fn(),
    maxOutputTokens: "",
    onMaxOutputTokensChange: vi.fn(),
    promptCacheRouting: "disabled",
    onPromptCacheRoutingChange: vi.fn(),
    catalogModels: [],
    onCatalogModelsChange: vi.fn(),
    speedTestEndpoints: [],
    customUserAgent: "",
    onCustomUserAgentChange: vi.fn(),
    localProxyHeadersOverride: "",
    onLocalProxyHeadersOverrideChange: vi.fn(),
    localProxyBodyOverride: "",
    onLocalProxyBodyOverrideChange: vi.fn(),
    ...overrides,
  };

  return render(
    <FormShell>
      <CodexFormFields {...props} />
    </FormShell>,
  );
};

describe("CodexFormFields catalog input modalities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes legacy catalog rows without inputModalities to explicit text", async () => {
    const handleCatalogModelsChange = vi.fn();

    renderCodexForm({
      catalogModels: [{ model: "legacy-model" }],
      onCatalogModelsChange: handleCatalogModelsChange,
    });

    await waitFor(() =>
      expect(handleCatalogModelsChange).toHaveBeenCalledWith([
        expect.objectContaining({
          model: "legacy-model",
          inputModalities: ["text"],
        }),
      ]),
    );
  });

  it("does not crash when catalog inputModalities contains non-string values", () => {
    expect(() =>
      renderCodexForm({
        catalogModels: [
          {
            model: "dirty-model",
            inputModalities: [123] as unknown as string[],
          },
        ],
      }),
    ).not.toThrow();
  });

  it("auto-fills matching catalog row input modalities after fetching models", async () => {
    vi.mocked(fetchModelsForConfig).mockResolvedValue([
      {
        id: "doubao-seed-2.0-pro",
        ownedBy: "Volcengine",
        inputModalities: ["text", "image"],
      },
    ]);
    const handleCatalogModelsChange = vi.fn();

    renderCodexForm({
      codexApiKey: "test-key",
      codexBaseUrl: "http://127.0.0.1:3011/v1",
      catalogModels: [{ model: "doubao-seed-2.0-pro" }],
      onCatalogModelsChange: handleCatalogModelsChange,
    });

    fireEvent.click(
      screen.getByRole("button", { name: "providerForm.fetchModels" }),
    );

    await waitFor(() =>
      expect(handleCatalogModelsChange).toHaveBeenLastCalledWith([
        expect.objectContaining({
          model: "doubao-seed-2.0-pro",
          inputModalities: ["text", "image"],
        }),
      ]),
    );
  });
});
