// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import ollama from "ollama";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log("vscode-chat is now alive!");

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
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
                  model: "deepseek-r1:14b",
                  messages: [{ role: "user", content: userPrompt }],
                  stream: true,
                });

                for await (const part of streamResponse) {
                  responseText += part.message.content;
                  panel.webview.postMessage({
                    command: "chatResponse",
                    text: responseText,
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
			console.log("vscode", vscode);

			document.getElementById('askBtn').addEventListener('click', () => {
				const text = document.getElementById('prompt').value;
				console.log("askBtn.click", text);
				vscode.postMessage({
					command: 'chat', text
				});
			}

			window.addEventListener('message', event => {
				const { command, text } = event.data;
				if (command === 'chatResponse') {
					console.log("chatResponse", text);
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
