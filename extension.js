const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const TEMPLATE_FOLDER = '.vs-templates';
const TEMPLATE_NAME_PATTERN = '{{Name}}';
const PLACEHOLDERS = {
    SELECT_TEMPLATE: 'Select your template...',
    TEMPLATE_NAME: 'Enter your template name...',
    CREATE_FOLDER: 'Create folder for template?'
};

class VSTemplateExtension {
    onStart(target) {
        const workspacePath = vscode.workspace.workspaceFolders[0].uri.path;
        const templatesFolder = path.join(workspacePath, TEMPLATE_FOLDER);
        const targetPath = target.path;
        const vswindow = vscode.window;

        if (fs.existsSync(templatesFolder)) {
            const templates = fs.readdirSync(templatesFolder);

            vswindow
                .showQuickPick(templates, {placeHolder: PLACEHOLDERS.SELECT_TEMPLATE})
                .then(userInput => {
                    vswindow
                        .showInputBox({placeHolder: PLACEHOLDERS.TEMPLATE_NAME})
                        .then(templateName => {
                            vswindow.showQuickPick([
                                'yes', 'no'
                            ], {placeHolder: PLACEHOLDERS.CREATE_FOLDER}).then(withFolderAnswer => {
                                const withFolder = withFolderAnswer === 'yes';

                                const createdTemplateFolder = path.join(targetPath, templateName);

                                if (withFolder)
                                    fs.mkdirSync(createdTemplateFolder);

                                const selectedTemplateFolder = path.join(templatesFolder, userInput);
                                const templateFiles = fs.readdirSync(selectedTemplateFolder);

                                templateFiles.map(file => {
                                    const fileContent = fs.readFileSync(path.join(selectedTemplateFolder, file));
                                    const regex = new RegExp(TEMPLATE_NAME_PATTERN, "g");
                                    const content = fileContent
                                        .toString()
                                        .replace(regex, templateName);

                                    fs.writeFileSync(path.join(withFolder
                                        ? createdTemplateFolder
                                        : targetPath, file.replace(TEMPLATE_NAME_PATTERN, templateName)), content);
                                });

                                vswindow.showInformationMessage(`Created a new "${userInput}" template`);
                            });

                        })
                });
        }
    }

    activate(context) {
        let disposable = vscode
            .commands
            .registerCommand('extension.generateVsTemplate', this.onStart);
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
