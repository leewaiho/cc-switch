import { describe, expect, it } from "vitest";
import { normalizeCodexCatalogModelsForSave } from "@/components/providers/forms/ProviderForm";

describe("ProviderForm Codex catalog helpers", () => {
  it("normalizes catalog rows and removes empty or duplicate models", () => {
    expect(
      normalizeCodexCatalogModelsForSave([
        { model: " deepseek-v4-flash ", displayName: " DeepSeek " },
        { model: "deepseek-v4-flash", displayName: "Duplicate" },
        { model: "", displayName: "Empty" },
        { model: "kimi-k2", contextWindow: "128000 tokens" },
      ]),
    ).toEqual([
      { model: "deepseek-v4-flash", displayName: "DeepSeek" },
      { model: "kimi-k2", contextWindow: 128000 },
    ]);
  });

  it("sanitizes input modalities before saving", () => {
    expect(
      normalizeCodexCatalogModelsForSave([
        {
          model: "vision-model",
          inputModalities: [
            " Text ",
            "IMAGE",
            "audio",
            "image",
            " ",
            "text",
          ],
        },
        { model: "text-model", inputModalities: ["audio", " "] },
      ]),
    ).toEqual([
      { model: "vision-model", inputModalities: ["text", "image"] },
      { model: "text-model" },
    ]);
  });

  it("preserves native-profile overrides (parallel tool calls + input modalities + base instructions)", () => {
    expect(
      normalizeCodexCatalogModelsForSave([
        {
          model: "MiniMax-M3",
          displayName: "MiniMax-M3",
          contextWindow: 1000000,
          supportsParallelToolCalls: true,
          inputModalities: ["text", "image"],
          baseInstructions:
            "  You are Codex, a coding agent based on MiniMax-M3.  ",
        },
        // false must be preserved (not dropped as falsy); empty modalities dropped;
        // empty/whitespace baseInstructions dropped
        {
          model: "mimo-v2.5-pro",
          supportsParallelToolCalls: false,
          inputModalities: [],
          baseInstructions: "   ",
        },
      ]),
    ).toEqual([
      {
        model: "MiniMax-M3",
        displayName: "MiniMax-M3",
        contextWindow: 1000000,
        supportsParallelToolCalls: true,
        inputModalities: ["text", "image"],
        baseInstructions: "You are Codex, a coding agent based on MiniMax-M3.",
      },
      { model: "mimo-v2.5-pro", supportsParallelToolCalls: false },
    ]);
  });

  it("preserves explicit model reasoning capabilities and rejects an unsupported model default", () => {
    expect(
      normalizeCodexCatalogModelsForSave([
        {
          model: "provider-model",
          supportedReasoningLevels: [
            { effort: "minimal", description: "Minimal" },
            { effort: "max", description: "Maximum" },
            { effort: "max", description: "Duplicate" },
          ],
          defaultReasoningLevel: "xhigh",
          reasoningLevels: [{ level: 6, effort: "max" }],
        },
      ]),
    ).toEqual([
      {
        model: "provider-model",
        supportedReasoningLevels: [
          { effort: "minimal", description: "Minimal" },
          { effort: "max", description: "Maximum" },
        ],
        reasoningLevels: [{ level: 6, effort: "max" }],
      },
    ]);
  });
});
