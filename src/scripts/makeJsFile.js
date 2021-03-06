const glob = require('glob');
const fs = require('fs');
const { kebabCase, camelCase } = require('lodash');
const validateMdLinks = require('./validateMdLinks');

const pathToDocs = 'src/docs';
const pathOutput = 'src/generated/mdRoutesData.js';
const globNestedMdFiles = '/**/*.md';

const constants = {
  FILE_URL: '$FILE_URL$',
  FOLDER_DATA_NAME: '_folderData',
};

const files = glob(pathToDocs + globNestedMdFiles, { sync: true });
console.log(`Найдено ${files.length} файлов`);

function getImportValue(variableName, pathName) {
  return `import ${variableName} from "${pathName}"\n`;
}

let importsText = '';

function getTitle(content) {
  let res = '';

  for (let i = 0; ; i++) {
    if (!content[i] || content[i] === '\n') break;
    if (content[i] !== '#') res += content[i];
  }

  return res.trim();
}

const excludedFiles = new Set(['src/docs/Main.md']);
const filesBasicData = [];
let lastFolderId;

// Принимается конвенция, что у нас нет вложенных папок.
// (только 1 уровень папок).
const jsonStrData = files
  .map((fileName, idx) => {
    if (excludedFiles.has(fileName)) return '';

    const pathCutted = fileName.replace('src/docs/', '').replace('.md', '');
    const nextId = (idx + 1).toString();
    const fileContent = fs.readFileSync(fileName).toString();
    const fileDataTitle = getTitle(fileContent);

    if (fileName.includes(constants.FOLDER_DATA_NAME)) {
      const splitted = pathCutted.split('/');
      const folderPathName = pathCutted.includes('/') ? splitted[0] : '';
      lastFolderId = `folder_${folderPathName}_${nextId}`;

      const folderData = {
        title: fileDataTitle,
        id: lastFolderId,
        type: 'folder',
      };

      return `${JSON.stringify(folderData)}`;
    }

    //
    // Work with file
    //

    const pathCuttedParts = pathCutted.split('/');
    const pathRouteValue = pathCuttedParts.map(kebabCase).join('/');

    const pathCuttedNoSlash = pathCutted.replace(/[/]/g, '-');
    const importVariableName = camelCase(
      pathCuttedNoSlash.replace(/[^a-z]/gi, '-')
    );

    const pathImportValue = `../docs/${pathCutted}.md`;
    const nestLevel = pathCutted.includes('/') ? 1 : 0;

    importsText += getImportValue(importVariableName, pathImportValue);

    const cuttedPathSplitted = pathCutted.split('/');

    const fileNameReady = nestLevel
      ? cuttedPathSplitted[1]
      : cuttedPathSplitted[0];

    const basicData = {
      appRoute: pathRouteValue,
      folderName: nestLevel ? cuttedPathSplitted[0] : undefined,
      folderId: lastFolderId,
      fileName: fileNameReady,
      fileUrl: constants.FILE_URL,
      title: fileDataTitle,
      nestLevel,
      id: nextId,
      type: 'file',
    };

    filesBasicData.push(basicData);

    // replace string value and it's quotes "" with import variable
    return JSON.stringify(basicData).replace(
      `"${constants.FILE_URL}"`,
      importVariableName
    );
  })
  .join(',');

const jsonReadyData = `export default [${jsonStrData}];`;
const contentToWrite = `${importsText}${jsonReadyData}`;

fs.writeFileSync(pathOutput, contentToWrite);
const errors = [];

files.forEach((fileName) => {
  const fileContent = fs.readFileSync(fileName).toString();
  try {
    validateMdLinks(fileContent, filesBasicData);
  } catch (e) {
    errors.push(e.message);
  }
});

if (errors.length) {
  console.warn('----------');
  console.warn('----------');
  console.warn('Ошибки:', errors);
  console.warn('----------');
  console.warn('----------');
} else {
  console.info('Ошибок не найдено');
}
