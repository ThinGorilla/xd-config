// get data from xd artwork
var sg = require("scenegraph");
// copy the data 
var clipboard = require("clipboard");
// write the data 
const fs = require("uxp").storage.localFileSystem;

// Font style 
function styleToWeight(fontStyle) {
    if (fontStyle.match(/\bBold\b/i)) {
        return "bold";
    } else if (fontStyle.match(/\bBlack\b/i) || fontStyle.match(/\bHeavy\b/i)) {  // TODO: "extra bold"? (move precedence higher if so)
        return 900;
    } else if (fontStyle.match(/\bSemi[- ]?bold\b/i) || fontStyle.match(/\bDemi[- ]?bold\b/i)) {
        return 600;
    } else if (fontStyle.match(/\bMedium\b/i)) {
        return 500;
    } else if (fontStyle.match(/\bLight\b/i)) {
        return 300;
    } else if (fontStyle.match(/\bUltra[- ]light\b/i)) {
        return 200;
    } else {
        return "normal";
    }
}

function styleIsItalic(fontStyle) {
    return (fontStyle.match(/\bItalic\b/i) || fontStyle.match(/\bOblique\b/i));
}

function colorToCSS(solidColor) {
    if (solidColor.a !== 255) {
        return `rgba(${solidColor.r}, ${solidColor.g}, ${solidColor.b}, ${num(solidColor.a/255)})`;
    } else {
        return solidColor.toHex();
    }
}

function num(value) {
    return Math.round(value * 100) / 100;
}

function eq(num1, num2) {
    return (Math.abs(num1 - num2) < 0.001);
}

function copy(selection) {
    var node = selection.items[0];
    if (!node) {
        return;
    }

    var css = "";

    // Size - for anything except point text
    if (!(node instanceof sg.Text && !node.areaBox)) {
        var bounds = node.localBounds;
        css += `width: ${num(bounds.width)}px;\n`;
        css += `height: ${num(bounds.height)}px;\n`;
    }

    // Corner metrics
    if (node.hasRoundedCorners) {
        var corners = node.effectiveCornerRadii;
        var tlbr = eq(corners.topLeft, corners.bottomRight);
        var trbl = eq(corners.topRight, corners.bottomLeft);
        if (tlbr && trbl) {
            if (eq(corners.topLeft, corners.topRight)) {
                css += `border-radius: ${num(corners.topLeft)}px;\n`;
            } else {
                css += `border-radius: ${num(corners.topLeft)}px ${num(corners.topRight)}px;\n`;
            }
        } else {
            css += `border-radius: ${num(corners.topLeft)}px ${num(corners.topRight)}px ${num(corners.bottomRight)}px ${num(corners.bottomLeft)}px;\n`;
        }
    }

    // Text styles
    if (node instanceof sg.Text) {
        var textStyles = node.styleRanges[0];
        if (textStyles.fontFamily.includes(" ")) {
            css += `font-family: "${textStyles.fontFamily}";\n`;
        } else {
            css += `font-family: ${textStyles.fontFamily};\n`;
        }
        css += `font-weight: ${styleToWeight(textStyles.fontStyle)};\n`;
        if (styleIsItalic(textStyles.fontStyle)) {
            css += `font-style: italic;\n`;
        }
        if (textStyles.underline) {
            css += `text-decoration: underline;\n`;
        }
        css += `font-size: ${num(textStyles.fontSize)}px;\n`;
        if (textStyles.charSpacing !== 0) {
            css += `letter-spacing: ${num(textStyles.charSpacing / 1000)}em;\n`;
        }
        if (node.lineSpacing !== 0) {
            css += `line-height: ${num(node.lineSpacing)}px;\n`;
        }
        css += `text-align: ${node.textAlign};\n`;
    }

    // Fill
    var fillName = (node instanceof sg.Text)? "color" : "background";
    if (node.fill && node.fillEnabled) {
        var fill = node.fill;
        if (fill instanceof sg.Color) {
            css += `${fillName}: ${colorToCSS(fill)};\n`;
        } else if (fill.colorStops) {
            var stops = fill.colorStops.map(stop => {
                return colorToCSS(stop.color) + " " + num(stop.stop * 100) + "%";
            });
            css += `${fillName}: linear-gradient(${ stops.join(", ") });\n`;  
        }
    } else {
        css += `${fillName}: transparent;\n`;
    }

    // Stroke
    if (node.stroke && node.strokeEnabled) {
        var stroke = node.stroke;
        css += `border: ${num(node.strokeWidth)}px solid ${colorToCSS(stroke)};\n`;
    }

    // Opacity
    if (node.opacity !== 1) {
        css += `opacity: ${num(node.opacity)};\n`;
    }

    // Dropshadow
    if (node.shadow && node.shadow.visible) {
        var shadow = node.shadow;
        var shadowSettings = `${num(shadow.x)}px ${num(shadow.y)}px ${num(shadow.blur)}px ${colorToCSS(shadow.color)}`;
        if (node instanceof sg.Text) {
            css += `text-shadow: ${shadowSettings};\n`;
        } else if (node instanceof sg.Rectangle) {
            css += `box-shadow: ${shadowSettings};\n`;
        } else {
            css += `filter: drop-shadow(${shadowSettings});\n`;
        }
    }

const newFile = await folder.createEntry("examples.txt", {overwrite: true});
newFile.write(clipboard.copyText(css));
}

exports.commands = {
    copy: copy
};