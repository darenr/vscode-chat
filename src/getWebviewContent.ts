import * as vscode from "vscode";

function getWebviewContent(styleGithubThemeUri: vscode.Uri): string {
  return /*html*/ `<!DOCTYPE html>
		<html lang="en">
		<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Deep Seek Chat</title>
  
    <link rel="stylesheet" href="${styleGithubThemeUri}">

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

      pre {
        white-space: pre-wrap;
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
          transition: 0.3s;
      }

      .tab-button.active {
          background: #ddd;
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
      <pre id="response_md"></pre>
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
            document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
            document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
            document.getElementById(tabId).classList.add("active");
            event.currentTarget.classList.add("active");
        }

		</script>

		</body>
		</html>
	`;
}

export { getWebviewContent };
