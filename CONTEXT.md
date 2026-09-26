# Agilo Analytics

Medusa admin plugin for store analytics: a fixed dashboard plus an AI dashboard, where a language model builds charts from store data.

## AI model selection

**Provider**:
The company that creates a model (Anthropic, OpenAI, Google), not the service that hosts it.
_Avoid_: Host, vendor, Vertex/Bedrock/Azure as providers

**Model family**:
A provider's named product line that stays stable across versions (for example Sonnet, Haiku, Gemini Flash, GPT mini).
_Avoid_: Model series, model line

**Tier**:
The speed-versus-quality level the admin picks: **Fast** or **Balanced**. Each tier maps to one model family per provider and a fixed reasoning effort.
_Avoid_: Mode, preset, level

**Model option**:
One entry in the picker: a provider and tier resolved to the newest available model in the matching family.
_Avoid_: Model choice, selection
