# DevPartner Hub

Quero desenvolver uma plataforma SaaS completa chamada DEV Partner Workspace.

A plataforma deve ser moderna, extremamente rápida, minimalista, responsiva e seguir a identidade visual do site https://devpartner.nexabee.com.br.

REFERÊNCIA VISUAL

Utilize a identidade da marca existente.

Visual premium.

Tema escuro.

Muito parecido com Linear, Notion, Vercel, Stripe Dashboard e GitHub.

Design limpo.

Animações suaves.

Cards arredondados.

Muito espaço em branco.

Ícones Lucide.

TailwindCSS.

Framer Motion.

React + Typescript.

------------------------------------------------

STACK

Frontend

- React

- Typescript

- Tailwind

- Framer Motion

- React Router

Backend

Supabase

Banco

PostgreSQL

Autenticação

Supabase Auth

Storage

Supabase Storage

Realtime

Supabase Realtime

Deploy

Vercel

------------------------------------------------

TIPOS DE USUÁRIO

Administrador

Gerente

Desenvolvedor

Cliente (Agência)

Cada perfil possui permissões diferentes.

------------------------------------------------

LOGIN

Tela premium.

Logo da DevPartner.

Login por email.

Login Google.

Esqueci minha senha.

2FA preparado para futura implementação.

------------------------------------------------

MENU LATERAL

Dashboard

Demandas

Projetos

Clientes

Equipe

Horas

Relatórios

Financeiro

Arquivos

Configurações

Meu Perfil

------------------------------------------------

DASHBOARD ADMIN

Mostrar cards

Demandas abertas

Demandas em andamento

Demandas aguardando cliente

Demandas concluídas

Horas trabalhadas hoje

Horas trabalhadas na semana

Horas do mês

Clientes ativos

Projetos ativos

Demandas urgentes

Gráfico de horas

Gráfico por cliente

Gráfico por categoria

Últimas atividades

Timeline

Notificações

------------------------------------------------

DASHBOARD CLIENTE

Mostrar

Horas contratadas

Horas utilizadas

Horas restantes

Demandas abertas

Demandas concluídas

Demandas em desenvolvimento

Últimas respostas

Próximas entregas

Status do plano

------------------------------------------------

CLIENTES

Cadastrar

Empresa

Responsável

Email

Telefone

Whatsapp

CNPJ

Plano contratado

Quantidade de horas mensais

Valor mensal

Status

Logo

Observações

------------------------------------------------

PLANOS

Basic

Starter

Pro

Enterprise

Cada plano possui

Quantidade de horas

Valor

SLA

Quantidade máxima de projetos

------------------------------------------------

PROJETOS

Nome

Cliente

Descrição

Cor

Status

Equipe

Prazo

Arquivos

Tags

------------------------------------------------

DEMANDAS

Uma demanda possui

Título

Descrição

Cliente

Projeto

Categoria

Prioridade

Responsável

Status

Data abertura

Data entrega

Estimativa de horas

Tempo gasto

Checklist

Comentários

Arquivos

Histórico

------------------------------------------------

STATUS

Nova

Em análise

Aguardando aprovação

Em desenvolvimento

Em testes

Aguardando cliente

Concluída

Cancelada

Pausada

------------------------------------------------

PRIORIDADE

Baixa

Normal

Alta

Urgente

------------------------------------------------

CATEGORIAS

WordPress

WooCommerce

Elementor

Landing Page

Sistema

Integração

API

Correção

Hospedagem

Servidor

Banco de Dados

SEO

Performance

Design

Outro

------------------------------------------------

KANBAN

Tela estilo Jira

Arrastar demandas

Salvar automaticamente

Realtime

------------------------------------------------

LISTA

Também permitir modo tabela

Filtros

Ordenação

Pesquisa

------------------------------------------------

DEMANDA

Ao abrir

Mostrar

Descrição

Histórico

Comentários

Arquivos

Checklist

Horas

Cronologia

------------------------------------------------

COMENTÁRIOS

Funcionam como chat

Editor rico

Emoji

Anexos

Marcar usuários

Notificações

------------------------------------------------

CHECKLIST

Adicionar itens

Concluir

Reordenar

------------------------------------------------

ANEXOS

Imagem

PDF

ZIP

Vídeo

Documentos

Salvar no Supabase Storage

------------------------------------------------

TIMER

Cada demanda possui

Botão

Iniciar

Pausar

Finalizar

Registrar sessão

Cada sessão salva

Hora início

Hora fim

Tempo

Usuário

Observação

Nunca perder histórico

------------------------------------------------

HORAS

Tela exclusiva

Mostrar

Horas por cliente

Horas por projeto

Horas por desenvolvedor

Horas por categoria

Horas por mês

Horas por semana

------------------------------------------------

RELATÓRIOS

Exportar

Excel

CSV

PDF

Relatórios

Cliente

Projeto

Equipe

Categoria

Horas

Financeiro

------------------------------------------------

CLIENTE

Ao entrar

Visualiza apenas

Suas demandas

Suas horas

Seus projetos

Seus arquivos

Seus comentários

Seu plano

------------------------------------------------

FINANCEIRO

Mostrar

Plano contratado

Horas disponíveis

Horas utilizadas

Horas restantes

Próxima cobrança

Histórico

Faturas

------------------------------------------------

NOTIFICAÇÕES

Tempo real

Quando

Nova demanda

Comentário

Mudança de status

Prazo próximo

Horas acabando

------------------------------------------------

EMAILS

Enviar automaticamente

Nova demanda

Demanda concluída

Comentário

Mudança de status

Horas restantes abaixo de 20%

------------------------------------------------

WHATSAPP

Preparar integração

Webhook

Cada notificação poderá futuramente ser enviada por WhatsApp

------------------------------------------------

CALENDÁRIO

Visualização mensal

Entregas

Prazos

Demandas

------------------------------------------------

PESQUISA

Pesquisar qualquer demanda

Projeto

Cliente

Comentário

------------------------------------------------

PERFIL

Foto

Nome

Cargo

Email

Senha

Preferências

------------------------------------------------

CONFIGURAÇÕES

Categorias

Status

Planos

Equipe

SMTP

Integrações

------------------------------------------------

DASHBOARD PREMIUM

Todos os gráficos devem utilizar Recharts.

Indicadores animados.

Cards modernos.

Transições suaves.

------------------------------------------------

PERFORMANCE

Lazy Loading

Code Splitting

React Query

Cache inteligente

------------------------------------------------

SEGURANÇA

Row Level Security no Supabase

Permissões por usuário

Logs de ações

------------------------------------------------

BANCO DE DADOS

Criar automaticamente todas as tabelas

users

clients

plans

projects

tasks

comments

attachments

timers

timer_sessions

notifications

files

invoices

activity_logs

categories

statuses

priorities

roles

permissions

------------------------------------------------

DIFERENCIAL

Na tela inicial do cliente mostrar uma barra grande:

Plano PRO

30 horas contratadas

18h utilizadas

12h restantes

Barra de progresso animada.

Ao atingir 90% do plano:

Notificação

Email

Badge vermelha

------------------------------------------------

EXTRA

Adicionar uma IA integrada chamada "Bee Assistant".

Ela pode:

Resumir demandas

Criar checklist automaticamente

Sugerir estimativa de horas

Detectar demandas parecidas

Criar documentação automática

Gerar changelog

Responder perguntas sobre projetos

Utilizar OpenAI futuramente.

------------------------------------------------

QUALIDADE

O sistema deve parecer um produto SaaS de milhões de dólares.

Todo o código deve ser componentizado.

Seguir boas práticas.

Arquitetura escalável.

Responsivo.

Dark mode.

Sem código duplicado.

Interface extremamente elegante.

Toda funcionalidade deve estar preparada para crescimento futuro.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://devpartner-nexus.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/864bc49a-219c-42d0-a3c6-15afcfd39ca7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
