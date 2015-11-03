import LoaderUtils from 'loader-utils';

export default function (content) {
    this.cacheable();

    const query = LoaderUtils.parseQuery(this.query);
    const { config: configArr = [], ...modules } = query;

    const config = {};

    for (const option of configArr) {
        config[option] = true;
    }

    const { allowOverride = false, disallowSameImport = false, checkIfUsed = false } = config;
    const imports = [];

    Object.keys(modules).forEach(inputName => {
        let dontCheckUsage = false;
        let isCustomPackage = false;
        let path = modules[inputName];
        let modifier = path[0];

        switch (modifier) {
            case '>':
                dontCheckUsage = true;
                path = path.slice(1);
                break;
            case '<':
                isCustomPackage = true;
                path = path.slice(1);
                break;
            default:
        }

        const destructRegex = /\{\s*([a-zA-Z]+)\s*}/;
        const isDestructingVar = destructRegex.test(inputName);

        let var_name = isDestructingVar ?
                inputName.match(destructRegex).pop() :
                inputName;

        if (path === true) {
            path = var_name;
        }

        const resultingStr = `import ${inputName} from '${path}';`;

        let valid = true;

        if (valid && !allowOverride) {
            valid = !(new RegExp([
                `(import\\s+${var_name})`,
                `(import\\s+\{\\s*${var_name}\\s*})`,
                `((var|let|const|function)+\\s+${var_name}\\b)`
            ].join('|'))).test(content);

            !valid && !isCustomPackage &&
                this.emitWarning(`"${var_name}" variable is already used. Import won't be added.`);
        }

        if (valid && disallowSameImport) {
            valid = !(new RegExp(
                `import.+from\\s+("|\')${path}("|\');*`
            )).test(content);

            !valid &&
                this.emitWarning(`"${path}" path is already used. Import won't be added.`);
        }

        if (valid && checkIfUsed && !dontCheckUsage) {
            if (var_name[0] !== '$') {
                valid = (new RegExp(
                    `\\b${var_name}\\b`
                )).test(content);
            } else {
                if (var_name === '$') {
                    valid = /\$((\.)|(\())/.test(content);
                } else {
                    valid = (new RegExp(
                        `\\${var_name}\\b`
                    )).test(content);
                }
            }
        }

        if (valid) {
            imports.push(resultingStr);
        }
    });

    return imports.join('\n') + '\n\n' + content;
};