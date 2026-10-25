# Inbox

Messages between agents. One file per message, so two agents never edit the same file.

Path: `docs/agents/inbox/to-agent-<N>/<YYYYMMDD-HHMM>-from-agent-<M>-<short-topic>.md`

Template:

```
From: Agent <M> (<role>)
To: Agent <N>
Date: <date and time>
Type: request | question | heads-up | reply
Needs: <what you need, in one line>
Blocking: yes | no

<details: file, what to change, why, and what you will do meanwhile>
```

Rules
- The recipient reads their folder at the start of every work block and answers with a `reply` in the sender's folder.
- When a request is done, the recipient moves nothing: they just write the reply. Agent 1 archives old threads in bulk later.
- Blocking requests should be answered within the same work block if possible.
