# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to this repository's local Markdown tracker and documents its human review state.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Delivered; awaiting user review and acceptance in this repository |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |
| Local terminal state       | `done`               | User reviewed and accepted the delivered ticket |

`done` is an additional local terminal state, not one of the five skill triage roles. After accepting a ticket, set its status to `done`. While checking an item, keep it `ready-for-human`; if it needs implementation changes, return it to `ready-for-agent` with a reproducible failure description. See [the review guide](../REVISAO-TICKETS.md) for the full flow.

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Edit the right-hand column to match whatever vocabulary you actually use.
