const {Rectangle, Color} = require("scenegraph");   // [1]

function rectangleHandlerFunction(selection) {      // [2]

    const newElement = new Rectangle();             // [3]
    newElement.width = 100;
    newElement.height = 50;
    newElement.fill = new Color("Purple");

    selection.insertionParent.addChild(newElement); // [4]
    newElement.moveInParentCoordinates(100, 100);   // [5]

}

module.exports = { // [6]
    commands: {
        createRectangle: rectangleHandlerFunction
    }
};