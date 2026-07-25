---
name: Tikvah emotion classification
description: Privacy boundary and behavior for the journal's silent emotion classifier.
---

Emotion classification is local, silent, and descriptive only: it runs after the safety gate, returns primary and secondary emotions with intensity and confidence, and stores the result inside the journal's encrypted payload.

**Why:** The emotion layer should help a person notice patterns without turning private writing into a remote profile, a diagnosis, or an unsolicited conversation.

**How to apply:** Keep the classifier deterministic and private. Never let it override crisis detection or generate advice; any future reflection feature must receive only explicitly shared text and remain behind the same safety boundary.