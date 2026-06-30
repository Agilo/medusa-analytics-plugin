# medusa-analytics-plugin — Claude Instructions

Always load the `project` skill at the start of every conversation:

```
./.claude/skills/project
```

This skill contains the project description, tech stack, architecture, conventions, and command reference. It keeps Claude aligned without repeating context every session.

## Skills in This Project

| Skill                  | When to use                                                  |
| ---------------------- | ------------------------------------------------------------ |
| `project`              | Always — baseline project context                            |
| `systematic-debugging` | Any time a bug, test failure, or unexpected behavior appears |
