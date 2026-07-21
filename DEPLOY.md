# Deploy do DeliveryHub no seu domínio

Este guia deixa o DeliveryHub **100% funcional** em um VPS/servidor com domínio e HTTPS.

## Requisitos

- Servidor Linux (Ubuntu 22.04+ recomendado)
- Docker + Docker Compose
- Domínio apontando (DNS A/AAAA) para o IP do servidor
- Portas 80 e 443 liberadas

## 1. Preparar o servidor

```bash
# Docker (Ubuntu)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

Clone o repositório:

```bash
git clone <URL_DO_REPOSITORIO> deliveryhub
cd deliveryhub
```

## 2. Configurar variáveis

```bash
cp .env.example .env
nano .env
```

Defina no mínimo:

```env
DATABASE_URL="file:/app/data/deliveryhub.db"
AUTH_SECRET="<gere com: openssl rand -base64 32>"
AUTH_URL="https://app.seudominio.com.br"
PORT=3000
SEED_ON_BOOT=true
```

> Na primeira subida, `SEED_ON_BOOT=true` cria o usuário demo. Depois, mude para `false`.

**Conta demo do seed**

- E-mail: `admin@deliveryhub.local`
- Senha: `deliveryhub123`

Troque a senha ou crie uma conta nova em `/registro` e desative o seed.

## 3. Subir a aplicação

```bash
docker compose up -d --build
docker compose ps
curl http://127.0.0.1:3000/api/health
```

Resposta esperada: `{"status":"ok","app":"deliveryhub",...}`

## 4. HTTPS + domínio

### Opção A — Caddy (mais simples)

1. Instale o Caddy no host
2. Use `deploy/Caddyfile.example` trocando o domínio
3. Caddy emite certificado Let's Encrypt automaticamente

### Opção B — Nginx + Certbot

1. Use `deploy/nginx.example.conf`
2. Emita o certificado:

```bash
sudo certbot --nginx -d app.seudominio.com.br
```

3. Confirme que `AUTH_URL` no `.env` é `https://app.seudominio.com.br`
4. Reinicie:

```bash
docker compose up -d
```

## 5. Checklist pós-deploy

- [ ] `https://seu-dominio/api/health` retorna ok
- [ ] Login em `/login` funciona
- [ ] Registro em `/registro` cria nova operação isolada
- [ ] Dados de uma organização não aparecem em outra
- [ ] Volume `deliveryhub_data` persiste o banco após restart

## 6. Backup

O banco SQLite fica no volume Docker. Backup rápido:

```bash
docker compose exec deliveryhub sh -c 'cp /app/data/deliveryhub.db /app/data/backup-$(date +%F).db'
docker cp deliveryhub:/app/data ./backup-deliveryhub
```

## 7. Atualizar versão

```bash
git pull
docker compose up -d --build
```

As migrations rodam automaticamente no entrypoint (`prisma migrate deploy`).

## Segurança

- Nunca publique `.env` com `AUTH_SECRET` real
- Use HTTPS em produção (`AUTH_URL` com `https://`)
- Após o primeiro acesso, desative `SEED_ON_BOOT` e altere a senha demo
- Mantenha o Docker e o sistema atualizados
