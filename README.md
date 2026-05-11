# Memento Médico — Mantecorp Farmasa

Auxiliar de prescrição médica (Pronto Atendimento 2026) — versão standalone para deploy no GitHub Pages.

URL final: **https://franklinmarketing-tech.github.io/memento-medico/**

---

## O que é este projeto

Este repositório contém **apenas** a página do Memento Médico (consulta de medicamentos por patologia, posologia e receita acumulativa). Não tem login, não tem painel REP, não tem Supabase. É um SPA estático que pode ser servido em qualquer CDN.

Stack: Vite + React 18 + TypeScript + Tailwind CSS + Framer Motion + Sonner + Lucide.

---

## Como rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:5173/memento-medico/ no navegador.

Para gerar o build de produção e checar localmente:

```bash
npm run build
npm run preview
```

---

## Como publicar no GitHub Pages (passo a passo)

### 1. Criar o repositório no GitHub

Acesse https://github.com/new e crie um repositório com estas configurações:

- **Owner:** `franklinmarketing-tech`
- **Repository name:** `memento-medico`
- **Public** (necessário para GitHub Pages no plano gratuito)
- **NÃO** marque "Initialize this repository with a README"

### 2. Subir o código

No terminal, dentro da pasta `memento-medico/`:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/franklinmarketing-tech/memento-medico.git
git push -u origin main
```

### 3. Ativar GitHub Pages

No GitHub, abra o repositório e:

1. Vá em **Settings** → **Pages**
2. Em **Source**, selecione **GitHub Actions**
3. Salve

### 4. Aguardar o deploy

O workflow `.github/workflows/deploy.yml` roda automaticamente a cada push em `main`. Acompanhe em **Actions** no GitHub. Quando terminar (cerca de 1–2 minutos), o site estará no ar em:

**https://franklinmarketing-tech.github.io/memento-medico/**

---

## Como sincronizar atualizações do projeto principal

Quando o `mementoPrescricao.ts` ou as imagens forem atualizadas no projeto principal (`data-dish-app-main`), rode estes comandos dentro da pasta `memento-medico/`:

```bash
# Copia os dados e imagens atualizados do projeto principal
cp "../data-dish-app-main/data-dish-app-main/src/data/mementoPrescricao.ts" "src/data/mementoPrescricao.ts"
cp -r "../data-dish-app-main/data-dish-app-main/public/produtos/." "public/produtos/"

# Sobe as alterações
git add .
git commit -m "Sync dados"
git push
```

O GitHub Actions detecta o push e refaz o deploy automaticamente.

---

## Estrutura

```
memento-medico/
├── .github/workflows/deploy.yml   # Deploy automático no push para main
├── public/
│   ├── favicon.ico
│   └── produtos/                  # 32 imagens dos medicamentos
├── src/
│   ├── components/
│   │   ├── ui/{filter-chip,skeleton}.tsx
│   │   ├── MementoPrescricaoPage.tsx
│   │   └── SectionSkeleton.tsx
│   ├── data/mementoPrescricao.ts
│   ├── lib/utils.ts
│   ├── App.tsx                    # Header + Memento + Footer
│   ├── main.tsx
│   ├── index.css                  # Tailwind + CSS variables
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.ts
├── postcss.config.js
└── vite.config.ts                 # base: "/memento-medico/"
```

---

## Aviso médico

Material destinado **exclusivamente a profissionais da saúde**. Sempre revisar a posologia com a bula oficial e o quadro clínico do paciente antes de prescrever.
