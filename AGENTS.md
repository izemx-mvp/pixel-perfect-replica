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
- App has 4 interfaces: Dashboard (/), Rapports & Analyse (/rapports?vue=…, internal sidebar), Service Client (/faq, /documents, /informations), Qualification IA (/qualification = WhatsApp leads pipeline, CRUD in localStorage). Consolidation deleted; /analyse redirects to /rapports. Why: client-mandated structure.
- src/data/rapports.ts is the single seeded dataset shared by Dashboard and Rapports; WhatsApp leads live in src/lib/leads.ts. Why: numbers must stay coherent.
