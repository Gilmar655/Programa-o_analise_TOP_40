# Programação das Parceiras · Conecta, Start e Engelmig

Painel interativo da agenda de programações das parceiras (Conecta, Start e Engelmig) de 05/11 a 05/12/2026, com 390 registros.

## O que tem no painel

- **Relógio ao vivo** no horário de Brasília
- **Filtros** por parceira, região, tipo de intervenção, status e período. Também dá para filtrar clicando nas barras e na tabela de parceiras.
- **Indicadores**: programações, canceladas e taxa de cancelamento, liberadas para execução e para documentação, rascunho + pendente, horas de janela prevista e média por dia
- **Visão geral**: volume diário por parceira, comparativo das parceiras, status e dia da semana
- **Território e intervenções**: região, tipo, natureza das obras, horário de início e matriz região × tipo
- **Qualidade dos dados**: controles de consistência e lista dos registros com ocorrência
- **Base detalhada**: todas as programações, com busca e ordenação
- **Projetos do recorte** (rodapé): um projeto por linha, com programações, canceladas, primeira e última data, status mais recente, horas e PowerON

## Estrutura

```
index.html              página do painel
assets/app.js           gráficos, filtros e tabelas
assets/dash-shim.js     camada de dados e redesenho (substitui o ambiente do Claude)
assets/d3.min.js        biblioteca D3 v7 (licença em assets/D3-LICENSE.txt)
data/programacoes.js    dados usados pela página (window.PROG_DATA)
data/programacoes.json  os mesmos dados em JSON
.nojekyll               faz o GitHub Pages servir os arquivos como estão
```

Não é preciso servidor nem instalar nada. Também abre direto no navegador com duplo clique no `index.html`.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub, por exemplo `programacao-parceiras`.
2. Envie todos os arquivos desta pasta para a raiz do repositório: **Add file → Upload files**, ou `git push`.
3. Abra **Settings → Pages**. Em *Source*, escolha **Deploy from a branch**, branch `main` e pasta `/ (root)`, e salve.
4. Em 1 a 2 minutos o painel fica disponível em `https://<seu-usuario>.github.io/programacao-parceiras/`.

> **Atenção:** em repositório público, o GitHub Pages deixa os dados visíveis para qualquer pessoa, inclusive projetos, equipamentos e números PowerON. Para dados internos, use um repositório privado com Pages restrito à organização, se o plano permitir, ou confirme antes com a área responsável.

## Atualizar os dados

Substitua `data/programacoes.js` mantendo o formato `window.PROG_DATA = [ ... ];`. Cada registro tem estes campos:

`linha, projeto, descricao, data (AAAA-MM-DD), status, tipo, poweron, equipamento, regiao, regiao_original, inicio, fim (AAAA-MM-DD HH:MM), contratada, parceira, janela_h, cancelada (true/false), inconsistencia, atencao`

`inconsistencia` e `atencao` são textos separados por `; `. Os rótulos aceitos são os que aparecem na aba *Qualidade dos dados*.

## Fonte

Planilha1 do arquivo `Dashboard_Programação_Parceiras_nov_jan.xlsx`.
Gestão de Programação · Enel Brasil · Grids
