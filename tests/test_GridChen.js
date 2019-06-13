import {test, assert} from './utils.js'
import '../modules/GridChen.js'
import {createColumnMatrixView, createRowMatrixView} from "../modules/DataViews.js";
import {NumberStringConverter} from "../modules/converter.js";

const decimalSep = new NumberStringConverter(1).decimalSep;

function getGridElement(gc) {
    return gc.shadowRoot.querySelector('.GRID');
}

function dispatchMouseDown(gc) {
    getGridElement(gc).dispatchEvent(new MouseEvent('mousedown'));
}

function dispatchKey(gc, eventInitDict) {
    gc.shadowRoot.firstElementChild.dispatchEvent(new KeyboardEvent('keydown', eventInitDict));
}

const schema = {
    title: 'test',
    columnSchemas: [{title: 'number', type: 'number', width: 0}, {title: 'string', type: 'string', width: 0}]
};

test('Selection', () => {
    const gc = new (customElements.get('grid-chen'))();

    let evt;
    gc.setEventListener('selectionchanged', function (_evt) {
        evt = _evt;
    });

    test('ColumnMatrix', () => {
        gc.resetFromView(createColumnMatrixView(schema, [[new Number(0)], ['a']]));
        test('ViewportText', () =>
            assert.equal(`0${decimalSep}00a`, getGridElement(gc).textContent)
        );

        dispatchMouseDown(gc);
        dispatchKey(gc, {code: 'ArrowRight', shiftKey: true});
        test('should expand selection', () => {
            assert.equal({min: 0, sup: 1}, evt.row);
            assert.equal({min: 0, sup: 2}, evt.col);
        });
    });

    test('RowMatrix', () => {
        gc.resetFromView(createRowMatrixView(schema, [[0, 'a']]));
        test('ViewportText', () =>
            assert.equal(`0${decimalSep}00a`, getGridElement(gc).textContent)
        );

        dispatchMouseDown(gc);
        dispatchKey(gc,{code: 'ArrowRight', shiftKey: true});
        test('should expand selection', () => {
            assert.equal({min: 0, sup: 1}, evt.row);
            assert.equal({min: 0, sup: 2}, evt.col);
        });
    });
});

