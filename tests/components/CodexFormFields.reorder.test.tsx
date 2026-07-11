import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FormProvider, useForm } from "react-hook-form";
import { CodexFormFields } from "@/components/providers/forms/CodexFormFields";

const dndState = vi.hoisted(() => ({
  sortableIds: [] as string[],
  onDragEnd: undefined as
    | ((event: { active: { id: string }; over: { id: string } | null }) => void)
    | undefined,
}));

vi.mock("@dnd-kit/core", async () => {
  const actual =
    await vi.importActual<typeof import("@dnd-kit/core")>("@dnd-kit/core");
  return {
    ...actual,
    DndContext: ({
      children,
      onDragEnd,
    }: {
      children: React.ReactNode;
      onDragEnd: typeof dndState.onDragEnd;
    }) => {
      dndState.onDragEnd = onDragEnd;
      return <div>{children}</div>;
    },
    useSensor: vi.fn(),
    useSensors: vi.fn(() => []),
  };
});

vi.mock("@dnd-kit/sortable", async () => {
  const actual =
    await vi.importActual<typeof import("@dnd-kit/sortable")>(
      "@dnd-kit/sortable",
    );
  return {
    ...actual,
    SortableContext: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    useSortable: vi.fn(({ id }: { id: string }) => {
      if (!dndState.sortableIds.includes(id)) dndState.sortableIds.push(id);
      return {
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        transition: undefined,
        isDragging: false,
      };
    }),
  };
});

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

function drag(active: string, over: string | null) {
  act(() => {
    dndState.onDragEnd?.({
      active: { id: active },
      over: over ? { id: over } : null,
    });
  });
}

describe("CodexFormFields model ordering", () => {
  beforeEach(() => {
    dndState.onDragEnd = undefined;
    dndState.sortableIds = [];
  });

  it("reorders configured catalog models after a drag", async () => {
    const onCatalogModelsChange = vi.fn();
    renderFields({
      catalogModels: [
        { model: "model-a", displayName: "Model A" },
        { model: "model-b", displayName: "Model B" },
      ],
      onCatalogModelsChange,
    });

    await waitFor(() => expect(onCatalogModelsChange).toHaveBeenCalled());
    onCatalogModelsChange.mockClear();

    expect(
      screen.getAllByRole("button", { name: "拖动调整模型顺序" }),
    ).toHaveLength(2);
    expect(dndState.onDragEnd).toBeTypeOf("function");
    const [firstId, secondId] = dndState.sortableIds.slice(-2);
    drag(firstId, secondId);

    await waitFor(() =>
      expect(onCatalogModelsChange).toHaveBeenLastCalledWith([
        expect.objectContaining({ model: "model-b" }),
        expect.objectContaining({ model: "model-a" }),
      ]),
    );
  });

  it("does not reorder without a different valid drop target", async () => {
    const onCatalogModelsChange = vi.fn();
    renderFields({
      catalogModels: [
        { model: "model-a", displayName: "Model A" },
        { model: "model-b", displayName: "Model B" },
      ],
      onCatalogModelsChange,
    });
    await waitFor(() => expect(onCatalogModelsChange).toHaveBeenCalled());
    onCatalogModelsChange.mockClear();

    const [firstId] = dndState.sortableIds.slice(-2);
    drag(firstId, null);
    drag(firstId, firstId);

    expect(onCatalogModelsChange).not.toHaveBeenCalled();
  });
});
