# Agent Instructions

> Template file. Customize the project-specific sections below after copying this into a new repository. If you also use `CLAUDE.md` or `GEMINI.md`, keep them aligned with this file.

## Copilot Workflow And Skill Routing

When a task matches a project skill in `.github/skills/`, consult that skill before proceeding. Use process skills before domain skills.

**Process skills**  
- `using-superpowers` — skill-first routing and workflow selection at the start of a task  
- `brainstorming` — feature design, UI changes, behavior changes, and ambiguous implementation requests  
- `writing-plans` — multi-step implementation plans before coding  
- `executing-plans` — carrying out a written plan in-sequence  
- `subagent-driven-development` — bounded subagent execution for approved plans  
- `systematic-debugging` — root-cause-first debugging for bugs, test failures, regressions, and build issues  
- `test-driven-development` — test-first behavior changes unless the user waives it or the task is docs-only or config-only  
- `verification-before-completion` — fresh verification before any success claim  
- `requesting-code-review` — review requests and post-change quality checks  

**Domain skills**  
- `frontend-design` — Next.js pages, React components, Tailwind CSS, UI polish, landing pages, dashboards, and other frontend design work  
- `atomic-design` — React or Next.js component creation, UI extraction, component refactors, and page/layout composition for projects using atoms/molecules/organisms/templates  
- `theme-factory` — choosing or generating a visual theme for branded artifacts, documents, reports, decks, or pages  
- `web-artifacts-builder` — complex multi-component HTML or React artifacts that need state, routing, bundling, or shadcn/ui-style workflows  
- `docx` — creating, editing, analyzing, converting, or formatting Word `.docx` files  
- `caveman` — terser responses, fewer tokens, caveman style, or less fluff  

Prefer these skills over ad hoc workflows when a request clearly matches them.

## Project Context To Customize

Replace this section with project-specific details after copying the template:

- Tech stack and framework
- Source roots and important directories
- Build, test, and lint commands
- Architecture conventions
- Project-specific workflows or restrictions

## Operating Principles

1. Check for existing tools, scripts, skills, or docs before inventing a new workflow.
2. Prefer project patterns over personal preference.
3. Keep changes focused on the current task.
4. When something breaks, read the error, fix the cause, retest, and update instructions or docs if the workflow changed.
5. Verify before claiming work is complete, fixed, or passing.

## Maintenance

- Remove or edit any skills you do not use in the target project.
- Keep this file aligned with `.github/instructions/project-skills.instructions.md`.
- If you maintain multiple root files for different agents, keep them synchronized.