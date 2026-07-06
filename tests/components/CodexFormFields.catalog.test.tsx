import { render, waitFor } from "@testing-library/react";
import type { ComponentProps, PropsWithChildren } from "react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { CodexFormFields } from "@/components/providers/forms/CodexFormFields";
import { Form } from "@/components/ui/form";

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
});
