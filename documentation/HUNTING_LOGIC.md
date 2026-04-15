# Leadpulse Hunting Logic (Industry-Agnostic)

Leadpulse is built to be industry-agnostic, meaning it can detect sales signals for any business type by deriving search parameters dynamically from the user's business profile and configured triggers.

## 1. The Prompt Architecture

The hunting engine (`geminiService.ts`) uses a multi-layered prompt strategy:

### A. Trigger-Derived Angles
One search call is executed per active trigger.
*   **Prompt**: `Find 1 recent news article... about: "${trigger.event}". Look for sources like ${trigger.source}. This should be relevant to someone selling ${trigger.product} because: ${trigger.logic}.`
*   **Goal**: Precision. Target specific events that the user has explicitly defined as high-intent.

### B. Profile-Derived Angles (Global Discovery)
Four broader search calls are executed to find general industry opportunities.
*   **Industry Trends**: `Find 1 recent news... relevant to the ${profile.industry} industry that would create demand for ${productsStr}.`
*   **Audience Expansion**: `Find 1 recent announcement... relevant to companies or individuals who buy ${productsStr}. Target: ${targetGroupsStr}.`
*   **Problem/Solution**: `Find 1 recent news... about a problem... that ${profile.name}'s products could solve.`
*   **Market Research**: `Find 1 recent industry report... that signals growing demand for ${productsStr}.`

## 2. Dynamic Grounding

*   **Google Search Grounding**: Every call uses the `googleSearch` tool for real-time verification.
*   **Deduping**: Headlines from previous calls are included in the prompt to prevent redundant results.
*   **Model**: Uses `gemini-3-flash-preview` for rapid execution and cost-efficiency.

## 3. Dossier & Verification

*   **Verify Source**: The engine cross-references headlines to find direct URLs, removing any hardcoded industry bias.
*   **Account Goal**: The dossier prompt focuses on identifying the **Target** (Buyer) rather than a specific industry company type (e.g. "Builder").
