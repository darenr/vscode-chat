import * as vscode from "vscode";
import ollama from "ollama";
import { Remarkable } from "remarkable";

export function activate(context: vscode.ExtensionContext) {
  console.log("vscode-chat is now alive!");

  const disposable = vscode.commands.registerCommand(
    "vscode-chat.start",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "deepChat",
        "Deep Seek Chat",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      panel.webview.html = getWebviewContent();

      panel.webview.onDidReceiveMessage(
        async (message: any) => {
          switch (message.command) {
            case "chat":
              console.log("onDidReceiveMessage", message.text);
              const userPrompt = message.text;
              let responseText = "";
              try {
                const streamResponse = await ollama.chat({
                  model: "mistral-small",
                  messages: [{ role: "user", content: userPrompt }],
                  stream: true,
                });

                const md = new Remarkable();

                for await (const part of streamResponse) {
                  responseText += part.message.content;
                  panel.webview.postMessage({
                    command: "chatResponse",
                    text: md.render(responseText),
                  });
                }
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

function getWebviewContent(): string {
  return /*html*/ `<!DOCTYPE html>
		<html lang="en">
		<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Deep Seek Chat</title>
		<style>
			body {
				font-family: Arial, sans-serif;	
				margin: 1rem;
			}

			#prompt {
				width: 100%;
				box-sizing: border-box;
			}
			
			#response {
				border: 1px solid #ccc;
				margin-top: 1rem;
				padding: 1rem;
				min-height: 200px;
				border-radius: 6px;
			}
		</style>
		</head>
		<body>
		<h2>Deep Seek Chat</h2>
		<textarea id="prompt" rows="3" placeholder="Type your prompt here"></textarea><br />
		<button id="askBtn">Ask</button>
		<div id="response"></div>

		<script>
			const vscode = acquireVsCodeApi();

			document.getElementById('askBtn').addEventListener('click', () => {
				const text = document.getElementById('prompt').value;
				vscode.postMessage({
					command: 'chat', text
				});
			});

			window.addEventListener('message', event => {
				const { command, text } = event.data;
				if (command === 'chatResponse') {
					document.getElementById('response').innerText = text;
				}
			});

		</script>

		</body>
		</html>
	`;
}

// This method is called when your extension is deactivated
export function deactivate() {}
