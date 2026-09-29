<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- App has exactly 4 interfaces: /analyse, /consolidation, Service Client (/faq, /documents, /informations tabs), /qualification — no Demandes/CRM pages. Why: client-mandated structure.
- src/data/business.ts is the single seeded dataset shared by Analyse and Consolidation. Why: numbers must stay coherent across both.
