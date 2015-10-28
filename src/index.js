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

        if (!(new RegExp('^import\\s+' + name)).test(content) &&
                !(new RegExp('^import.+from\\s+"|\'react"|\';*$')).test(content) &&
                (!prop_name || !(new RegExp('^import\\s+\{\\s*' + prop_name + '\\s*\}')).test(content))) {
            imports.push(`import ${name} from "${path}";`);
        }
    });

    return imports.join('\n') + '\n\n' + content;
};