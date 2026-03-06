# 📨 SQS Template Catalog & Tester

Uma aplicação web moderna desenvolvida para acelerar e padronizar o teste de microsserviços e arquiteturas orientadas a eventos. 

**Objetivo Central:** Eliminar o preenchimento manual, demorado e propenso a erros de payloads no console da AWS. Este app permite que desenvolvedores e QAs criem um catálogo centralizado de templates SQS, injetem dados mockados dinamicamente em tempo de execução e façam a publicação direta nas filas com apenas um clique.

![Tela principal do SQS Template Catalog mostrando a lista de templates, o editor Monaco com um JSON contendo placeholders do Faker, e um modal para preenchimento de variáveis manuais.](./screenshots/catalog.png)

---

## ✨ Funcionalidades

* **📖 Gestão de Catálogo:** Crie, edite e organize templates de mensagens especificando a URL da fila, o corpo (JSON) e os `Message Attributes`.
* **💻 Editor Avançado (Monaco):** O mesmo motor de edição do VS Code integrado na web, oferecendo validação de sintaxe JSON e highlight nativos.
* **🎲 Geração de Dados Dinâmicos (Faker.js):** * Use placeholders mágicos no seu JSON (ex: `{{faker.internet.email}}`).
  * **IntelliSense integrado:** O editor possui autocomplete sugerindo as funções do Faker enquanto você digita.
  * O dado é gerado aleatoriamente no exato momento da publicação.
* **✍️ Variáveis Customizadas (Inputs Manuais):** Precisa testar um ID específico? Adicione `{{orderId}}` no JSON. O app interceptará o envio e abrirá um modal para você digitar o valor desejado.
* **🕒 Histórico e Re-envio:** Um log local salva os últimos disparos, mostrando o payload final (já processado com os dados reais) e o status da AWS. Re-envie qualquer mensagem com um clique.
* **🤝 Colaboração (Import/Export):** Exporte seu catálogo inteiro para um arquivo `.json` e compartilhe com o time. A importação faz um *merge* inteligente (baseado em IDs) para não apagar os templates que seus colegas já criaram localmente.

---

## 🛠️ Tecnologias Utilizadas

* **Frontend:** Next.js (App Router), React, Tailwind CSS
* **UI/UX:** shadcn/ui, Lucide Icons
* **Editor:** `@monaco-editor/react`
* **Mock Data:** `@faker-js/faker`
* **Integração:** AWS SDK para JavaScript (`@aws-sdk/client-sqs`)

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
* Node.js (v18+ recomendado)
* Credenciais da AWS configuradas com permissão de `sqs:SendMessage` nas filas de teste.

### Passo a Passo

1. **Clone o repositório:**

```bash
git clone https://github.com/douglasgusson/sqs-template-catalog.git
```

2. **Acesse a pasta do projeto e instale as dependências:**

```bash
cd sqs-template-catalog
npm install
```

3. **Configure as Variáveis de Ambiente:**

Crie um arquivo `.env.local` na raiz do projeto e adicione suas credenciais da AWS (nunca commite este arquivo para o repositório):

```txt
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
```
_Nota: Se você utiliza perfis da AWS configurados na sua máquina (ex: em `~/.aws/credentials`), o AWS SDK Node.js geralmente consegue capturá-los automaticamente._

4. **Inicie o servidor de desenvolvimento:**

```bash
npm run dev
````

5. **Acesse a aplicação:**

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.


## 💡 Guia Rápido de Uso

1. Criando o primeiro template: Clique em "Novo Template", dê um nome descritivo e cole a URL da sua fila SQS.

1. Usando o Autocomplete: No campo do corpo da mensagem (JSON), comece a digitar `{"email": "{{faker.` e espere o editor sugerir as opções. Selecione a função desejada.

1. Publicando: Clique em "Publicar na Fila". Se houver variáveis manuais no seu JSON (como `{{userId}}`), preencha o modal que irá aparecer. Em instantes, um Toast de sucesso com o `MessageId` da AWS será exibido.

1. Compartilhando com o time: Use o botão Exportar no topo da tela para baixar suas configurações e envie para a equipe. Eles só precisam clicar em Importar para ter acesso às mesmas mensagens em suas máquinas locais.

Desenvolvido para simplificar o dia a dia e focar no que importa: a qualidade e a lógica de negócio. 🚀
