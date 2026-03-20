import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listGenerators } from "@/lib/generators";

const generators = listGenerators();

const beforePayload = `{
  "idade": "{{idadeUsuario:number}}",
  "ativo": "{{@boolean:boolean}}",
  "codigo": "{{codigoAcesso}}",
  "idString": "{{@uuid:string}}"
}`;

const afterPayload = `{
  "idade": 25,
  "ativo": true,
  "codigo": "ABC-123",
  "idString": "fdd2bbf8-3b0e-4a78-b6f5-c0d3d879f5a9"
}`;

export default function DocsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <Image
            src="/pigeon.png"
            alt="Pigeon SQS Dispatcher"
            width={40}
            height={40}
            className="shrink-0"
          />
          Manual — Pigeon SQS Dispatcher
        </h1>
        <p className="text-sm text-muted-foreground">
          Guia oficial de uso do catálogo de templates, parser tipado e fluxo de envio para AWS SQS.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>1. Introdução</CardTitle>
          <CardDescription>Como o aplicativo funciona no fluxo de ponta a ponta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            O app mantém um catálogo local de templates de mensagem SQS. Cada template possui
            Queue URL, JSON Body e Message Attributes.
          </p>
          <p>
            Ao enviar, o parser resolve placeholders (manuais e automáticos), valida o JSON final e
            executa a publicação no SQS via Server Action.
          </p>
          <p>
            O resultado do envio fica salvo no histórico, com payload final resolvido e status da
            resposta da AWS.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Editor e Autocomplete</CardTitle>
          <CardDescription>Uso do Monaco Editor com IntelliSense.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            O JSON é editado no Monaco com validação de sintaxe. Para placeholders automáticos,
            digite <code>{"{{@"}</code> dentro de um valor string e continue com o nome do gerador.
          </p>
          <p>
            O autocomplete é acionado pelo <code>@</code> e sugere os geradores disponíveis no container
            interno (encapsulando Faker).
          </p>
          <p>
            Use o botão <strong>Ampliar</strong> (ícone ↗) ao lado do campo JSON Body para abrir o
            editor em tela cheia — ideal para edição confortável de payloads grandes.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Variáveis Manuais</CardTitle>
          <CardDescription>Quando o app abre o modal e quais campos ele renderiza.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Placeholders sem <code>@</code> são manuais (ex.: <code>{"{{orderId}}"}</code>, <code>{"{{idade:number}}"}</code>). Antes do
            envio, o app intercepta essas variáveis e abre o modal para coleta dos valores.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li><code>string</code> (ou omitido): input texto.</li>
            <li><code>number</code>: input numérico.</li>
            <li><code>boolean</code>: seletor <code>True/False</code>.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Geradores Automáticos</CardTitle>
          <CardDescription>
            Lista completa dos {generators.length} geradores disponíveis com <code>@</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Placeholders iniciados por <code>@</code> usam o container de geradores interno.
            Todos os geradores abaixo estão disponíveis no autocomplete do editor.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {generators.map((generator) => (
              <div key={generator.key} className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <code className="text-xs font-medium text-foreground">{`{{${generator.token}}}`}</code>
                <p className="mt-0.5 text-xs text-muted-foreground">{generator.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Tipagem e Aspas (Importante)</CardTitle>
          <CardDescription>
            Como manter JSON válido no editor e enviar tipos corretos no payload final.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            No editor, os placeholders ficam entre aspas para manter o JSON válido enquanto você
            edita. No envio, o parser identifica o sufixo tipado e converte os valores.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li><code>:string</code> (padrão): mantém aspas no payload final.</li>
            <li><code>:number</code>: converte para número e remove aspas.</li>
            <li><code>:boolean</code>: converte para boolean e remove aspas.</li>
          </ul>

          <div className="space-y-2">
            <h3 className="font-medium text-foreground">Antes (no Editor)</h3>
            <pre className="overflow-x-auto rounded-md border border-border bg-muted/20 p-3 text-xs text-foreground">
              {beforePayload}
            </pre>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-foreground">Depois (Payload Final)</h3>
            <pre className="overflow-x-auto rounded-md border border-border bg-muted/20 p-3 text-xs text-foreground">
              {afterPayload}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Preview antes de Enviar</CardTitle>
          <CardDescription>Valide o payload final antes de publicar na fila.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Clique em <strong>Preview</strong> para visualizar o payload final com todas as variáveis
            resolvidas antes de enviar. A partir do preview, você pode confirmar o envio ou cancelar.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Atalhos e Produtividade</CardTitle>
          <CardDescription>Recursos para agilizar o fluxo de trabalho.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc space-y-1 pl-5">
            <li><kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs">Ctrl+S</kbd> / <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs">⌘+S</kbd>: salva o template sem precisar clicar no botão.</li>
            <li><strong>Busca fuzzy</strong> na sidebar: filtre templates rapidamente por nome ou descrição.</li>
            <li><strong>Duplicar template</strong>: crie uma cópia a partir de um template existente.</li>
            <li><strong>Editor ampliado</strong>: expanda o editor JSON em tela cheia para payloads grandes.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. Importar/Exportar</CardTitle>
          <CardDescription>Compartilhamento de templates entre membros da equipe.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Use <strong>Exportar</strong> para gerar um arquivo JSON com seu catálogo local.
          </p>
          <p>
            Use <strong>Importar</strong> para carregar templates e aplicar merge por ID (novos
            templates são adicionados e existentes são atualizados).
          </p>
          <p>
            Esse fluxo facilita replicar cenários de teste entre squads mantendo consistência de
            contrato de mensagens.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
