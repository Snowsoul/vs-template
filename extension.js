const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const PLACEHOLDERS = {
    SELECT_TEMPLATE: 'Select your template...',
    TEMPLATE_NAME: 'Enter your template name...',
    CREATE_FOLDER: 'Create folder for template?'
};

class VSTemplateExtension {
    onStart(target) {
        const vsconfig = vscode
            .workspace
            .getConfiguration('vs-template');
        const TEMPLATE_FOLDER = vsconfig.get('folder') || '.vs-templates';
        const workspacePath = vscode.workspace.workspaceFolders[0].uri.path;
        const templatesFolder = path.join(workspacePath, TEMPLATE_FOLDER);
        const targetPath = !!target
            ? target.path
            : workspacePath;
        const vswindow = vscode.window;

        if (fs.existsSync(templatesFolder)) {
            const templates = fs.readdirSync(templatesFolder);

            vswindow
                .showQuickPick(templates, {placeHolder: PLACEHOLDERS.SELECT_TEMPLATE})
                .then(userInput => {
                    vswindow
                        .showInputBox({placeHolder: PLACEHOLDERS.TEMPLATE_NAME})
                        .then(templateName => {
                            const autoCreateFolder = vsconfig.get('Auto Create Folder');

                            if (autoCreateFolder) {
                                this.createTemplate('yes', targetPath, templateName, templatesFolder, userInput);
                                vswindow.showInformationMessage(`Created a new "${userInput}" template`);
                                return;
                            }

                            vswindow.showQuickPick([
                                'yes', 'no'
                            ], {placeHolder: PLACEHOLDERS.CREATE_FOLDER}).then(withFolderAnswer => {
                                this.createTemplate(withFolderAnswer, targetPath, templateName, templatesFolder, userInput);
                                vswindow.showInformationMessage(`Created a new "${userInput}" template`);
                            });
                        })
                });
        }
    }

    createTemplate(withFolderAnswer, targetPath, templateName, templatesFolder, userInput) {
        const vsconfig = vscode
            .workspace
            .getConfiguration('vs-template');
        const TEMPLATE_NAME_PATTERN = vsconfig.get('pattern') || '{{Name}}';

        const withFolder = withFolderAnswer === 'yes';

        const createdTemplateFolder = path.join(targetPath, templateName);

        if (withFolder) {
            if (fs.existsSync(createdTemplateFolder))
                return vscode.window.showErrorMessage(`Folder "${templateName}" already exists !`);
            fs.mkdirSync(createdTemplateFolder);
        }

        const selectedTemplateFolder = path.join(templatesFolder, userInput);
        const templateFiles = fs.readdirSync(selectedTemplateFolder);

        templateFiles.map(file => {
            const fileContent = fs.readFileSync(path.join(selectedTemplateFolder, file));
            const regex = new RegExp(TEMPLATE_NAME_PATTERN, "g");
            const content = fileContent
                .toString()
                .replace(regex, templateName);

            const filePath = path.join(withFolder
                ? createdTemplateFolder
                : targetPath, file.replace(TEMPLATE_NAME_PATTERN, templateName));

            if (fs.existsSync(filePath))
                return vscode.window.showErrorMessage(`File "${file.replace(TEMPLATE_NAME_PATTERN, templateName)}" already exists !`);

            fs.writeFileSync(filePath, content);
        });
    }

    activate(context) {
        let disposable = vscode
            .commands
            .registerCommand('extension.generateVsTemplate', this.onStart.bind(this));
        context
            .subscriptions
            .push(disposable);
    }

    deactivate() {}
}

const extension = new VSTemplateExtension();

exports.activate = extension
    .activate
    .bind(extension);
exports.deactivate = extension.deactivate;
