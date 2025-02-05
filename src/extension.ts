import * as vscode from "vscode";
import ollama from "ollama";
import markdownit from "markdown-it";
import { full as emoji } from "markdown-it-emoji";
import hljs from "highlight.js";
import { getWebviewContent } from "./getWebviewContent";

const model = "qwen2.5-coder:7b";

export function activate(context: vscode.ExtensionContext) {
  console.log("vscode-chat is now alive!");

  const disposable = vscode.commands.registerCommand(
    "vscode-chat.start",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "codeChat",
        "Code Chat",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      const styleGithubThemeUri = panel.webview.asWebviewUri(
        panel.webview.asWebviewUri(
          vscode.Uri.file(
            context.asAbsolutePath("node_modules/highlight.js/styles/xt256.css")
          )
        )
      );

      panel.webview.html = getWebviewContent(styleGithubThemeUri);

      const md: markdownit = markdownit({
        breaks: true,
        highlight: function (str, lang) {
          if (lang && hljs.getLanguage(lang)) {
            try {
              return hljs.highlight(str, { language: lang }).value;
            } catch (__) {}
          }

          return ""; // use external default escaping
        },
      }).use(emoji);

      panel.webview.onDidReceiveMessage(
        async (message: any) => {
          switch (message.command) {
            case "chat":
              console.log("onDidReceiveMessage", message.text);

              let responseText = "";
              try {
                // get any selected text in the editor

                const selectedText = getSelectedTextInOtherWindow();

                // update selection:

                // editor
                //   .edit((builder) => {
                //     builder.replace(editor.selection, text);
                //   })
                //   .then((success) => {
                //     var postion = editor.selection.end;
                //     editor.selection = new vscode.Selection(postion, postion);
                //   });

                const context_size =
                  message.text.length + selectedText.length + 256;

                const prompt_prefix = `You are an expert, but if you don't know, just say so. 
                Be concise and minimal in your answers.  Answer the question:`;

                const prompt = `${prompt_prefix} ${message.text}${
                  selectedText
                    ? `\nin the context of the following: ${selectedText}`
                    : ""
                }`;

                const streamResponse = await ollama.chat({
                  model: model,
                  messages: [{ role: "user", content: prompt }],
                  stream: true,
                  options: {
                    num_ctx: context_size,
                  },
                });

                for await (const part of streamResponse) {
                  responseText += part.message.content;
                  panel.webview.postMessage({
                    command: "chatResponse",
                    html: md.render(responseText),
                    md: responseText,
                  });
                }
                panel.webview.postMessage({
                  command: "chatFinished",
                });
              } catch (error: any) {
                panel.webview.postMessage({
                  command: "chatResponse",
                  text: `Error: ${String(error.message)}`,
                });
                console.error(error);
              }

              break;
          }
        },
        undefined,
        context.subscriptions
      );
    }
  );

  context.subscriptions.push(disposable);
}

function getSelectedTextInOtherWindow() {
  for (const otherWindowEditor of vscode.window.visibleTextEditors) {
    const selection = otherWindowEditor.selection;
    if (selection && !selection.isEmpty) {
      const selectionRange = new vscode.Range(
        selection.start.line,
        selection.start.character,
        selection.end.line,
        selection.end.character
      );
      return otherWindowEditor.document.getText(selectionRange);
    }
  }
  return "";
}

// This method is called when your extension is deactivated
export function deactivate() {}
