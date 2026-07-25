---
name: Tikvah safety boundary
description: Product safety decisions for the anonymous journal and future reflection features.
---

The journal's first safety boundary is local and synchronous: assess the current draft before encryption, persistence, or any optional reflection request. A high-risk result pauses the normal flow, does not save or send the draft, and presents emergency and trusted-person support without promising confidentiality.

**Why:** Crisis handling must not depend on an AI provider, network availability, or a successful save, and private journal text should not leave the device just to perform a basic safety check.

**How to apply:** Keep future reflection or server integrations behind the same local assessment gate. Treat the detector as an imperfect signal, never as a diagnosis or a replacement for emergency services.