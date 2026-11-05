# Programação das Parceiras · Conecta, Start e Engelmig

Painel interativo da agenda das parceiras Conecta, Start e Engelmig (05/11 a 05/12/2026, 390 programações).

**Tudo fica dentro do `index.html`**, com os números e gráficos já gravados no próprio HTML. Eles aparecem mesmo se o JavaScript estiver bloqueado; nesse caso surge uma faixa amarela avisando que filtros, abas e relógio ficam indisponíveis. O arquivo também traz os dados, os filtros e a biblioteca D3. Não depende de outras pastas nem de internet. Basta esse arquivo estar na raiz do repositório.

## Publicar no GitHub Pages

1. No repositório, clique em **Add file → Upload files**.
2. Arraste o arquivo **`index.html`**, sozinho e solto, sem pasta por cima. Ele precisa ficar na **raiz** do repositório. Clique em **Commit changes**.
3. Abra **Settings → Pages**:
   - em *Source*, escolha **Deploy from a branch**;
   - em *Branch*, escolha **main** e a pasta **/ (root)**;
   - clique em **Save**.
4. Espere de 1 a 3 minutos e abra `https://<seu-usuario>.github.io/<nome-do-repositorio>/`.
   - O andamento aparece na aba **Actions**, em *pages build and deployment*.
5. Se aparecer a versão antiga, recarregue com **Ctrl + F5**.

### Se a página abrir sem dados

- Confira se o `index.html` está na raiz. Se estiver dentro de uma pasta, o endereço muda para `.../<repositorio>/<pasta>/`.
- Apague do repositório os arquivos da versão anterior: `assets/`, `data/` e o `index.html` antigo.
- Faixa vermelha no topo: erro ao montar o painel (envie a mensagem para correção).
- Faixa amarela no topo: o JavaScript está bloqueado pelo navegador ou pela rede. Os números aparecem, mas sem filtros.
- O rodapé mostra a **versão** (data e hora). Use isso para confirmar que o GitHub já publicou o arquivo novo.

> **Atenção:** em repositório público, os dados (projetos, equipamentos, PowerON) ficam visíveis para qualquer pessoa.

## Arquivos

- `index.html` — o painel completo (o único arquivo necessário)
- `dados-programacoes.json` — cópia dos dados, só para consulta ou reuso
- `.nojekyll` — opcional; faz o GitHub servir os arquivos como estão

Fonte: Planilha1 de `Dashboard_Programação_Parceiras_nov_jan.xlsx`. Gestão de Programação · Enel Brasil · Grids.
