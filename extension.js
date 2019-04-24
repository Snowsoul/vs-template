const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const dashify = require('dashify');

const PLACEHOLDERS = {
  SELECT_TEMPLATE: 'Select your template...',
  TEMPLATE_NAME: 'Enter your template name...',
  CREATE_FOLDER: 'Create folder for template?',
  DASHES_SEPARATOR: 'Separate Name Using Dashes (-) ?'
};

class VSTemplateExtension {
  onStart(target) {
    const vsconfig = vscode.workspace.getConfiguration('vs-template');
    const TEMPLATE_FOLDER = vsconfig.get('folder') || '.vs-templates';
    const workspacePath = vscode.workspace.workspaceFolders[0].uri.path;
    const templatesFolder = path.join(workspacePath, TEMPLATE_FOLDER);
    const targetPath = !!target ? target.path : workspacePath;
    const vswindow = vscode.window;

    if (!fs.existsSync(templatesFolder))
      return vswindow.showErrorMessage(
        `The templates folder does not exist.
        Either create a new .vs-templates folder
        or change the folder name in the user config.
        `
      );

    if (fs.existsSync(templatesFolder)) {
      const templates = fs.readdirSync(templatesFolder);

      vswindow
        .showQuickPick(templates, { placeHolder: PLACEHOLDERS.SELECT_TEMPLATE })
        .then(userInput => {
          vswindow
            .showInputBox({ placeHolder: PLACEHOLDERS.TEMPLATE_NAME })
            .then(templateName => {
              const autoCreateFolder = vsconfig.get('Auto Create Folder');

              vswindow
              .showQuickPick(['yes', 'no'], {
                placeHolder: PLACEHOLDERS.DASHES_SEPARATOR,
              }).then(response => {
                const withDashes = response === 'yes';
                if (autoCreateFolder) {
                  this.createTemplate(
                    'yes',
                    targetPath,
                    templateName,
                    templatesFolder,
                    userInput,
                    withDashes
                  );
                  vswindow.showInformationMessage(
                    `Created a new "${userInput}" template`
                  );

                  return;
                }

                vswindow
                  .showQuickPick(['yes', 'no'], {
                    placeHolder: PLACEHOLDERS.CREATE_FOLDER,
                  })
                  .then(withFolderAnswer => {
                    this.createTemplate(
                      withFolderAnswer,
                      targetPath,
                      templateName,
                      templatesFolder,
                      userInput,
                      withDashes
                    );
                    vswindow.showInformationMessage(
                      `Created a new "${userInput}" template`
                    );
                  });
              });
            });
        });
    }
  }

  createTemplate(
    withFolderAnswer,
    targetPath,
    templateName,
    templatesFolder,
    userInput,
    withDashes
  ) {
    const vsconfig = vscode.workspace.getConfiguration('vs-template');
    const TEMPLATE_NAME_PATTERN = vsconfig.get('pattern') || '{{Name}}';

    const withFolder = withFolderAnswer === 'yes';

    const createdTemplateFolder = path.join(targetPath, templateName);

    if (withFolder) {
      if (fs.existsSync(createdTemplateFolder))
        return vscode.window.showErrorMessage(
          `Folder "${templateName}" already exists !`
        );
      fs.mkdirSync(createdTemplateFolder);
    }

    const selectedTemplateFolder = path.join(templatesFolder, userInput);
    const templateFiles = fs.readdirSync(selectedTemplateFolder);

    templateFiles.map(file => {
      const fileContent = fs.readFileSync(
        path.join(selectedTemplateFolder, file)
      );
      const regex = new RegExp(TEMPLATE_NAME_PATTERN, 'g');
      const content = fileContent.toString().replace(regex, templateName);
      let newFile = templateName;

      // If it has more than 2 capital letters
      // And the first one is capital it means it uses PascalCase
      if (withDashes && templateName[0].match(/[A-Z]/g) && templateName.match(/[A-Z]/g).length > 1) {
        newFile = dashify(templateName);
      }

      const filePath = path.join(
        withFolder ? createdTemplateFolder : targetPath,
        file.replace(TEMPLATE_NAME_PATTERN, newFile)
      );

      if (fs.existsSync(filePath))
        return vscode.window.showErrorMessage(
          `File "${file.replace(
            TEMPLATE_NAME_PATTERN,
            templateName
          )}" already exists !`
        );

      fs.writeFileSync(filePath, content);
    });
  }

  activate(context) {
    let disposable = vscode.commands.registerCommand(
      'extension.generateVsTemplate',
      this.onStart.bind(this)
    );
    context.subscriptions.push(disposable);
  }

  deactivate() {}
}

const extension = new VSTemplateExtension();

exports.activate = extension.activate.bind(extension);
exports.deactivate = extension.deactivate;
