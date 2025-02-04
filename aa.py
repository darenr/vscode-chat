              const model = "qwen2.5-coder:7b";
              console.log("onDidReceiveMessage", message.text);
              let responseText = "";
              try {
                // get any selected text in the editor
                //
                // const editor = vscode.window.activeTextEditor;
                // if (!editor) {
                //   vscode.window.showInformationMessage(
                //     "No selection detected."
                //   );
                //   return;
                // }
                // var text = editor.document.getText(editor.selection);
                // if (text === "") {
                //   vscode.window.showInformationMessage(
                //     "No selection detected."
                //   );
                //   return;
                // }

                // update selection:

                // editor
                //   .edit((builder) => {
                //     builder.replace(editor.selection, text);
                //   })
                //   .then((success) => {
                //     var postion = editor.selection.end;
                //     editor.selection = new vscode.Selection(postion, postion);
                //   });
