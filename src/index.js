import LoaderUtils from 'loader-utils';

export default function (content) {
    this.cacheable();

    const query = LoaderUtils.parseQuery(this.query);
    const imports = [];

    Object.keys(query).forEach(name => {
        let prop_name;
        let path = query[name];

        const destruct_regex = /\{\s*([a-zA-Z]+)\s*}/;

        if (path === true) {
            path = name;
        }

        if (destruct_regex.test(name)) {
            prop_name = name.match(destruct_regex).pop();
        }

        if (!(new RegExp([
                    `(^import\\s+${name})`,
                    `(^import.+from\\s+"|\'${path}"|\';*$)`,
                    `(^import\\s+\{\\s*${prop_name}\\s*})`,
                    `((var|let|const)+\\s+${name}\\b)`,
                    `((var|let|const)+\\s+${prop_name}\\b)`
                ].join('|'))).test(content)) {
            imports.push(`import ${name} from "${path}";`);
        }
    });

    return imports.join('\n') + '\n\n' + content;
};