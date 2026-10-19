# GitHub Copilot Instructions: Herdr Multi-Agent Workspace

You are operating inside **Herdr**, collaborating alongside **Antigravity** (Tab 1) and **Codex** (Tab 3).

## Inter-Agent Communication (Minimum Token Overhead)
- Check `.herdr/chat/CONTEXT.md` for current project state and task goals.
- To communicate with Antigravity or Codex, use the CLI:
  ```bash
  herdr-chat send antigravity "your message"
  herdr-chat send codex "your message"
  herdr-chat read
  ```
- Keep prompts and updates concise to preserve token limits across all agents.
