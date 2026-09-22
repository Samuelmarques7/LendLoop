# LendLoop

Este projeto propõe uma plataforma de aluguel online entre pessoas (modelo peer-to-peer), com o objetivo de facilitar o acesso a itens de uso esporádico e dar utilidade a objetos que estão ociosos.

Com poucos cliques, qualquer pessoa pode anunciar um item ou alugar o que precisa. A proposta promove economia para uns e renda extra para outros — tudo de forma prática, acessível e segura.

---

## Funcionalidades

- Autenticação de usuários
- Perfil do usuário
- Criação e gerenciamento de anúncios
- Busca com filtros por categoria/localização
- Sistema de reservas
- Chat entre usuários

---

## Tecnologias utilizadas

- Front-end: JavaScript, React, Vite e Tailwind CSS
- Back-end: Node.js, Express, MongoDB e Mongoose
- Serviços opcionais: Cloudinary para imagens e Gmail SMTP para recuperação de senha
- JavaScript
- React
- Tailwind CSS

## Como rodar localmente

Pré-requisitos: Node.js 20+, MongoDB e npm.

1. Instale as dependências:

   ```bash
   cd backend && npm install
   cd ../front && npm install
   ```

2. Crie `backend/.env` a partir de `backend/.env.example` e preencha `MONGO_URI` e `JWT_SECRET`. Cloudinary e SMTP são necessários para upload e recuperação de senha.

3. Inicie a API e o frontend em terminais separados:

   ```bash
   cd backend && npm run dev
   cd front && npm run dev
   ```

   A API responde em `http://localhost:3000` e o frontend em `http://localhost:5173`.

## Verificações

```bash
cd front && npm run lint
cd front && npm run build
node --check backend/server.js
```

O endpoint `GET /api/health` confirma que a API está disponível. O projeto ainda não possui testes automatizados de integração; antes de produção, adicione cobertura para autenticação, reservas, pagamentos e verificação de identidade.

