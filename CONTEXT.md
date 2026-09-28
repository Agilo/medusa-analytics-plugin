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

## AI Gateway access

**Gateway key**:
One admin's Vercel AI Gateway API key. Each admin saves their own; it is stored encrypted and never shown again after saving.
_Avoid_: API key (ambiguous), token

**Encryption key**:
One secret per install, set by the developer in the plugin options, used to encrypt every Gateway key at rest. It is not a Gateway key and is never sent to Vercel. Optional: without it, admins cannot save Gateway keys.
_Avoid_: API key, encryption secret, gateway secret
