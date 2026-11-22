# FLOP Agent Lab

Independent FLOP devnet diagnostics. Open dist/index.html via a static host. Public health and catalog checks require browser access to FLOP's APIs. A healthy endpoint or listed model doesn't verify inference.

## Local quick start

Use Node.js 20+ on the machine holding your gateway credential:

```bash
node runner.mjs ~/.flop/devnet.ZXgZPu/gateway-key qwen/qwen2.5-0.5b-instruct sample.txt
```

This sends one sample gateway diagnostic note to FLOP, capped at 64 output tokens. Inspect the report before sharing. The script saves status and timing, with no bearer key, prompt, or model reply in the report. Use the model allowed by your key.

To check a recorded request without submitting inference, append its request ID as the fourth argument. Import the generated report JSON into the dashboard for a local display. A released receipt records a request that did not settle. A settled receipt records settlement. An unverified receipt needs another lookup.

## Demo recording

Refresh public checks, run the sample on Ubuntu, then open the resulting report in the dashboard. Show the real receipt state and request ID. Never record the gateway key. If there is no settled receipt, say so in the demo.



