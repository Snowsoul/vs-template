// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const TEMPLATE_FOLDER = '.vs-templates';
const TEMPLATE_NAME_PATTERN = '{{Name}}';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vs-generator" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.generateVsTemplate', function (target) {
		console.log("​activate -> target", target)
        const workspacePath = vscode.workspace.workspaceFolders[0].uri.path;
        const templatesFolder = path.join(workspacePath, TEMPLATE_FOLDER);
        const targetPath = target.path;

        if (fs.existsSync(templatesFolder)) {
            const templates = fs.readdirSync(templatesFolder);
            // The code you place here will be executed every time your command is executed

            vscode.window.showQuickPick(templates, { placeHolder : 'Select your template...' }).then(userInput => {
               vscode.window.showInputBox({ placeHolder: 'Enter your template name...' }).then(templateName => {
                    vscode.window.showQuickPick(['yes', 'no'], { placeHolder: 'Create folder for template?' }).then(withFolderAnswer => {
                        const withFolder = withFolderAnswer === 'yes';

                        const createdTemplateFolder = path.join(targetPath, templateName);

                        if (withFolder)
                            fs.mkdirSync(createdTemplateFolder);

                        const selectedTemplateFolder = path.join(templatesFolder, userInput);
                        const templateFiles = fs.readdirSync(selectedTemplateFolder);

                        templateFiles.map(file => {
                            const fileContent = fs.readFileSync(path.join(selectedTemplateFolder, file));
                            const regex = new RegExp(TEMPLATE_NAME_PATTERN, "g");
                            const content = fileContent.toString().replace(regex, templateName);

                            fs.writeFileSync(path.join(withFolder ? createdTemplateFolder : targetPath, file.replace(TEMPLATE_NAME_PATTERN, templateName)), content);
                        });
                        // Display a message box to the user
                        vscode.window.showInformationMessage(`Created a new "${userInput}" template`);
                    });

               })
            });
        }

    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
