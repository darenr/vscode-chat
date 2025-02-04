import * as vscode from "vscode";
import ollama from "ollama";
import markdownit from "markdown-it";
import { full as emoji } from "markdown-it-emoji";
import hljs from "highlight.js";

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
              const model = "qwen2.5-coder:7b";
              let responseText = "";
              try {
                // get any selected text in the editor

                const selectedText = getSelectedTextInOtherWindow();
                console.log("selectedText", selectedText);

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
                let prompt = message.text;
                if (selectedText) {
                  prompt = `
                    You are an expert in all things. 
                    Answer the question: 
                    
                    "${message.text}" 
                    
                    in the context of the following:
                    
                    "${selectedText}"
                  `;
                }

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
                    text: md.render(responseText),
                  });
                }
                panel.webview.postMessage({
                  command: "chatFinished",
                });
                console.log(responseText);
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

function getWebviewContent(): string {
  return /*html*/ `<!DOCTYPE html>
		<html lang="en">
		<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Deep Seek Chat</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/default.min.css">

		<style>
			body {
				font-family: Arial, sans-serif;	
				margin: 1rem;
			}

			#prompt {
				width: 100%;
 				border-radius: 6px;
        padding: 0.5rem;
				box-sizing: border-box;
			}
			
			#response {
				border: 1px solid #ccc;
				margin-top: 1rem;
				padding: 1rem;
				min-height: 200px;
				border-radius: 6px;
			}

      #askBtn, #clearBtn {
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        border: none;
        background-color: #007acc;
        color: white;
        border-radius: 6px;
        cursor: pointer;
      }

      div.code {
        white-space: pre;
      }
		</style>
		</head>
		<body>
		<h2>Chat with AI</h2>
		<textarea id="prompt" rows="3" placeholder="Type your prompt here"></textarea><br />
		<button id="askBtn" class="vscode-chat-extn">Ask</button>
		<button id="clearBtn" class="vscode-chat-extn">Clear</button>
		<div id="response"></div>

		<script>
			const vscode = acquireVsCodeApi();

      document.getElementById('prompt').focus();

      document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
          event.preventDefault(); 
          document.getElementById('askBtn').click(); // Trigger button click
        }
      });      

			document.getElementById('askBtn').addEventListener('click', () => {
				const text = document.getElementById('prompt').value;
        document.body.style.cursor = 'wait';
				vscode.postMessage({
					command: 'chat', text
				});
			});

      document.getElementById('clearBtn').addEventListener('click', () => {
				document.getElementById('response').innerHTML = "";
			});

			window.addEventListener('message', event => {
				const { command, text } = event.data;
				if (command === 'chatResponse') {
					document.getElementById('response').innerHTML = text;
				}
        else if (command === 'chatFinished') {
          document.body.style.cursor = 'default';
        }
			});

		</script>

		</body>
		</html>
	`;
}

// This method is called when your extension is deactivated
export function deactivate() {}
