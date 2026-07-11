import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FormProvider, useForm } from "react-hook-form";
import { CodexFormFields } from "@/components/providers/forms/CodexFormFields";

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

if (!Element.prototype.scrollIntoView)
  Element.prototype.scrollIntoView = () => {};
const noop = () => {};

function Harness(props: React.ComponentProps<typeof CodexFormFields>) {
  const form = useForm({
    defaultValues: { localProxyRequestOverrides: { headers: "", body: "" } },
  });
  return (
    <FormProvider {...form}>
      <CodexFormFields {...props} />
    </FormProvider>
  );
}

function renderFields(
  overrides: Partial<React.ComponentProps<typeof CodexFormFields>>,
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
  return render(<Harness {...props} />);
}

describe("CodexFormFields model ordering", () => {
  it("moves configured catalog models up and down", async () => {
    const user = userEvent.setup();
    const onCatalogModelsChange = vi.fn();
    renderFields({
      catalogModels: [
        { model: "model-a", displayName: "Model A" },
        { model: "model-b", displayName: "Model B" },
      ],
      onCatalogModelsChange,
    });

    await user.click(screen.getAllByRole("button", { name: "下移" })[0]);
    await waitFor(() =>
      expect(onCatalogModelsChange).toHaveBeenLastCalledWith([
        expect.objectContaining({ model: "model-b" }),
        expect.objectContaining({ model: "model-a" }),
      ]),
    );

    onCatalogModelsChange.mockClear();
    await user.click(screen.getAllByRole("button", { name: "上移" })[1]);
    await waitFor(() =>
      expect(onCatalogModelsChange).toHaveBeenLastCalledWith([
        expect.objectContaining({ model: "model-a" }),
        expect.objectContaining({ model: "model-b" }),
      ]),
    );
  });
});
