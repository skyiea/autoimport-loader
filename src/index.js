import LoaderUtils from 'loader-utils';

export default function (content) {
    this.cacheable();

    const query = LoaderUtils.parseQuery(this.query);
    const { config: configArr = [], ...modules } = query;

    const config = {};

    for (const option of configArr) {
        config[option] = true;
    }

    const { allowOverride = false, allowSameImport = false, checkIfUsed = false,
            debug = false } = config;
    const imports = [];

    debug && console.log(`### MODULE CONTENT:\n${content}`);

    Object.keys(modules).forEach(inputName => {
        let dontCheckUsage = false;
        let path = modules[inputName];

        if (path[0] === '>') {
            dontCheckUsage = true;
            path = path.slice(1);
        }

        const destruct_regex = /\{\s*([a-zA-Z]+)\s*}/;
        const is_destr_name = destruct_regex.test(inputName);

        let var_name = is_destr_name ?
                inputName.match(destruct_regex).pop() :
                inputName;

        if (path === true) {
            path = var_name;
        }

        debug && console.log(`####################`);
        debug && console.log(`### INPUT_NAME: ${inputName}`);
        debug && console.log(`### VAR_NAME: ${var_name}`);
        debug && console.log(`### PATH: ${path}`);

        let valid = true;

        if (valid && !allowOverride) {
            valid = !(new RegExp([
                `(import\\s+${var_name})`,
                `(import\\s+\{\\s*${var_name}\\s*})`,
                `((var|let|const!function)+\\s+${var_name}\\b)`
            ].join('|'))).test(content);

            debug && !valid && console.log(`### VAR DECLARATION EXISTS. EXITING..`);
        }

        if (valid && !allowSameImport) {
            valid = !(new RegExp(
                `import.+from\\s+("|\')${path}("|\');*$`
            )).test(content);

            debug && !valid && console.log(`### SUCH IMPORT PATH ALREADY EXISTS. EXITING..`);
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

            debug && !valid && console.log(`### VAR NOT USED. EXITING..`);
        }

        if (valid) {
            debug && console.log(`### PUTTING IMPORT: import ${inputName} from "${path}";`);

            imports.push(`import ${inputName} from '${path}';`);
        }

        debug && console.log(`####################`);
    });

    return imports.join('\n') + '\n\n' + content;
};