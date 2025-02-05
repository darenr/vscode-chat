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
        "Deep Chat",
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

      #askBtn, #clearBtn {
        margin-top: 0.5rem;
        margin-bottom: 0.5rem;
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

      /* Tab Container */
      .tabs {
          display: flex;
          margin-top: 20px;
          xmargin-bottom: 10px;
      }

      /* Tab Buttons */
      .tab-button {
          cursor: pointer;
          border: none;
          background-color:rgb(87, 87, 87);
          outline: none;
          padding: 0.5rem 1rem;
          border-top-right-radius: 6px;
          border-top-left-radius: 6px;
      }

      .tab-button.active {
          background: #ddd;
          font-weight: bold;
      }

      /* Tab Content */
      .tab-content {
          display: none;
          margin-top: 0;
          padding: 1rem;
				  min-height: 200px;
          border: 1px solid #ccc;
          border-top-right-radius: 6px;
          border-bottom-left-radius: 6px;
          border-bottom-right-radius: 6px;
      }

      #response_html, #response_md {
        margin: 0;
      }

      .tab-content.active {
          display: block;
      }

		</style>
		</head>
		<body>
		<h2>Chat with AI</h2>
		<textarea id="prompt" rows="3" placeholder="Type your prompt here"></textarea><br />

    <button id="askBtn" class="vscode-chat-extn">Ask</button>
		<button id="clearBtn" class="vscode-chat-extn">Clear</button>
    <br/>

    <!-- Tabs -->
    <div class="tabs">
        <button class="tab-button active" onclick="openTab(event, 'tab1')">Formatted</button>
        <button class="tab-button" onclick="openTab(event, 'tab2')">Raw</button>
    </div>

    <!-- Tab Content -->
    <div id="tab1" class="tab-content active">
      <div id="response_html"></div>
    </div>
    <div id="tab2" class="tab-content">
      <pre>
        <code>
          <div id="response_md"></div>
        </code>
      </pre>
    </div>


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
				document.getElementById('response_html').innerHTML = "";
				document.getElementById('response_md').innerHTML = "";
				document.getElementById('prompt').value = "";
        document.getElementById('prompt').focus();
			});

			window.addEventListener('message', event => {
				const { command, html, md } = event.data;
				if (command === 'chatResponse') {
					document.getElementById('response_html').innerHTML = html;
					document.getElementById('response_md').innerHTML = md;
				}
        else if (command === 'chatFinished') {
          document.body.style.cursor = 'default';
        }
			});

      function openTab(event, tabId) {
            // Hide all tab contents
            document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));

            // Deactivate all buttons
            document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));

            // Show the selected tab
            document.getElementById(tabId).classList.add("active");

            // Activate the clicked button
            event.currentTarget.classList.add("active");
        }

		</script>

		</body>
		</html>
	`;
}

// This method is called when your extension is deactivated
export function deactivate() {}
