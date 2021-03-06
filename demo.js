import {createView} from "./gridchen/matrixview.js"
import {createTransactionManager, registerUndo} from "./gridchen/utils.js";

export function createInteractiveDemoGrid(schema, orgData) {
    const container = document.body.appendChild(document.createElement('div'));
    schema.pathPrefix = '';

    function html(html) {
        container.innerHTML = html;
    }

    html`
    <label class="demo">
        Edit JSON Schema
        <textarea class="demo schema"></textarea>
    </label>
    <label class="demo">
        Edit JavaScript Matrix
        <textarea class="demo data"></textarea>
    </label>
    <label class="demo grid">
        Grid
        <grid-chen></grid-chen>
    </label>
    <label class="demo patch">
        JSON Transaction Patch
        <textarea class="demo" readonly></textarea>
    </label>
    <label class="demo tsv">
        TabularSeparatedValues (as of clipboard)
        <textarea class="demo" readonly></textarea>
    </label>`;

    const schemaElement = container.querySelector('.schema');
    const dataElement = container.querySelector('.data');
    const patchElement = document.querySelector('.patch textarea');
    const tsvElement = document.querySelector('.tsv textarea');
    const gridElement = container.querySelector('grid-chen');
    const tm = createTransactionManager();
    registerUndo(document.body, tm);
    let view;

    function resetGrid() {

        function newView() {
            try {
                schema = JSON.parse(schemaElement.value);
            } catch (e) {
                e.message = 'Error in JSON Schema: ' + e.message;
                return e;
            }

            let data;
            if (dataElement.value.trim() === '') {
                dataElement.value = 'null';
            }

            try {
                data = REPR.parse(dataElement.value);
            } catch (e) {
                e.message = 'Error in JavaScript Data: ' + e.message;
                return e;
            }

            return createView(schema, data);
        }

        patchElement.value = '';
        view = newView();
        gridElement.resetFromView(view, tm);
        tsvElement.value = gridElement._toTSV();
    }

    /**
     * @type {GridChenNS.Transaction} trans
     */
    tm.addEventListener('change', function (evt) {
        dataElement.value = REPR.stringify(view.getModel(), null, 2);
        patchElement.value = REPR.stringify(evt.transaction.operations, null, 2);
        tsvElement.value = gridElement._toTSV();
    });
    schemaElement.value = JSON.stringify(schema, null, 4);
    dataElement.oninput = schemaElement.oninput = resetGrid;
    dataElement.value = REPR.stringify(orgData, null, 2);
    resetGrid();
}

/**
 * Same as the global JSON object, but representation is JavaScript, not JSON.
 */
export const REPR = {
    /**
     * Return a JavaScript object from its representation.
     * @param {string} s
     * @returns {*}
     */
    parse(s) {
        s = s.trim();
        if (s === '') {
            throw new SyntaxError('Unexpected end of REPR input');
        }
        return eval('(' + s + ')')
    },
    /**
     * Return a string containing a printable representation of an object.
     * @param {*} v
     * @param {null} replacer
     * @param {number=} depth
     * @param {number=} level
     * @returns {string}
     */
    stringify(v, replacer, depth, level) {
        level = level || 0;
        depth = depth || 0;
        const nl0 = '\n' + Array.from({length: level * depth}, () => '  ').join('');
        const nl1 = nl0 + Array.from({length: depth}, () => '  ').join('');
        const out = [];
        if (v == null) {
            out.push('null');
        } else if (v.constructor === String) {
            out.push('"');
            out.push(v.replace('\n', '\\n'));
            out.push('"');
        } else if (v.constructor === Date) {
            out.push('new Date("' + v.toISOString().replace(':00.000Z', 'Z') + '")');
        } else if (Array.isArray(v)) {
            out.push('[' + nl1);
            const a = [];
            for (const value of v) {
                a.push(REPR.stringify(value, replacer, depth, level + 1));
            }
            out.push(a.join(',' + nl1));
            out.push(nl0 + ']');
        } else if (typeof v === 'object') {
            out.push('{' + nl1);
            const a = [];
            for (const [key, value] of Object.entries(v)) {
                a.push('"' + key + '": ' + REPR.stringify(value, replacer, depth, level + 1));
            }
            out.push(a.join(',' + nl1));
            out.push(nl0 + '}');
        } else {
            out.push(v);
        }
        return out.join('')
    }
};
