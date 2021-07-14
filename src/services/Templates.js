
const INCH = 914400;

const PT = 12700;

const EMU = 1;

const DEFAULT_SIZE = {
    width: {
        magnitude: 0,
        unit: 'EMU',
    },
    height: {
        magnitude: 0,
        unit: 'EMU',
    },
};

const DEFAULT_TRANSFORM = {
    scaleX: 1,
    scaleY: 1,
    shearX: 0,
    shearY: 0,
    translateX: 0,
    translateY: 0,
    unit: 'EMU',
}

function solve(prevLayouts, layout, weight) {
    if (weight === 1) {
        // Default Layout
        return layout; 
    }
}

function consumeDimension(dimension) {
    if (dimension === undefined) {
        throw Error('no dimension');
    }
    if (!dimension.hasOwnProperty('magnitude')) {
        return 0;
    }
    let result = dimension.magnitude;
    if (dimension.unit === 'PT') {
        result *= PT;
    }
    else if (dimension.unit === 'EMU') {
        result *= EMU;
    }
    else {
        throw Error('unit is not supported: ' + dimension.unit);
    }
    return result;
}

function consumeSize(size) {
    if (size === undefined) {
        throw Error('no field size');
    }

    return {
        width: consumeDimension(size.width),
        height: consumeDimension(size.height),
    }
}

function consumeTransform(transform) {
    if (transform === undefined) {
        transform = { ...DEFAULT_TRANSFORM };
    }

    if (!transform.hasOwnProperty('scaleX')) {
        transform.scaleX = 0;
    }

    if (!transform.hasOwnProperty('scaleY')) {
        transform.scaleY = 0;
    }

    if (!transform.hasOwnProperty('shearX')) {
        transform.shearX = 0;
    }

    if (!transform.hasOwnProperty('shearY')) {
        transform.shearY = 0;
    }

    if (!transform.hasOwnProperty('translateX')) {
        transform.translateX = 0;
    }

    if (!transform.hasOwnProperty('translateY')) {
        transform.translateY = 0;
    }

    if (transform.unit === 'PT') {
        transform.translateX *= PT;
        transform.translateY *= PT;
    }
    else if (transform.unit === 'EMU') {
        transform.translateX *= EMU;
        transform.translateY *= EMU;
    }
    else {
        throw Error('cannot support unit: ' + transform.unit);
    }
    return transform;
}

function multiplyTransforms(t1, t2) {
    t1 = consumeTransform(t1);
    t2 = consumeTransform(t2);
    let t = { ...t1 };
    t.scaleX = t1.scaleX * t2.scaleX + t1.shearX * t2.shearY;
    t.shearX = t1.scaleX * t2.shearX + t1.shearX * t2.scaleY;
    t.translateX = t1.scaleX * t2.translateX + t1.shearX * t2.translateY + t1.translateX;
    
    t.shearY = t1.shearY * t2.scaleX + t1.scaleY * t2.shearY;
    t.scaleY = t1.shearY * t2.shearX + t1.scaleY * t2.scaleY;
    t.translateY = t1.shearY * t2.translateX + t1.scaleY * t2.translateY + t1.translateY;

    return t;
}

function getPageElementType(element) {
    if (element.hasOwnProperty('shape')) {
        return 'shape';
    }
    if (element.hasOwnProperty('image')) {
        return 'image';
    }
    if (element.hasOwnProperty('line')) {
        return 'line';
    }
    if (element.hasOwnProperty('elementGroup')) {
        return 'elementGroup';
    }
    console.log('cannot find such type', element);
    return 'unspecified';
}

function toLines(layout) {
    let lines = [];

    let horPts = [];
    let verPts = [];
    
    for (let e of layout.pageElements) {
        horPts.push({
            pt: e.startX,
            type: 0,
        });
        horPts.push({
            pt: e.finishX,
            type: 1,
        });
        verPts.push({
            pt: e.startY,
            type: 0,
        });
        verPts.push({
            pt: e.finishY,
            type: 1,
        });
    }

    const comparator = (p1, p2) => {
        if (p1.pt < p2.pt) {
            return -1;
        }
        if (p1.pt > p2.pt) {
            return 1;
        }
        if (p1.type > p2.type) {
            return -1;
        }
        if (p1.type < p2.type) {
            return 1;
        }
        return 0;
    };

    horPts.sort(comparator);
    verPts.sort(comparator);

    let open = 0;
    for (let e of horPts) {
        if (e.type === 1) {
            open -= 1;
        }
        else {
            open += 1;
        }
        if (open === 0) {
            continue;
        }
        let color = {
            rgbColor: {
                red: 1,
                green: 0,
                blue: 0,
            },
        };

        if (e.type === 1) {
            color = {
                rgbColor: {
                    red: 0,
                    green: 0,
                    blue: 1,
                },
            }
        }

        lines.push({
            size: {
                height: {
                    magnitude: 7 * INCH,
                    unit: 'EMU',
                },
                width: {
                    magnitude: 0,
                    unit: 'EMU',
                },
            },
            transform: {
                scaleX: 1,
                scaleY: 1,
                shearX: 0,
                shearY: 0,
                translateX: e.pt,
                translateY: 0,
                unit: 'EMU',
            },
            line: {
                lineProperties: {
                    lineFill: {
                        solidFill: {
                            color: color,
                            alpha: 1,
                        }
                    },
                    weight: {
                        magnitude: PT,
                        unit: 'EMU'
                    },
                    dashStyle: 'SOLID',
                },
                lineType: 'STRAIGHT_LINE',
                lineCategory: 'STRAIGHT'
            },
            additional: {
                originalType: 'line',
            }
        });
    }

    open = 0;
    for (let e of verPts) {
        if (e.type === 1) {
            open -= 1;
        }
        else {
            open += 1;
        }
        if (open === 0) {
            continue;
        }
        let color = {
            rgbColor: {
                red: 1,
                green: 0,
                blue: 0,
            },
        };

        if (e.type === 1) {
            color = {
                rgbColor: {
                    red: 0,
                    green: 0,
                    blue: 1,
                },
            }
        }

        lines.push({
            size: {
                height: {
                    magnitude: 0,
                    unit: 'EMU',
                },
                width: {
                    magnitude: 11 * INCH,
                    unit: 'EMU',
                },
            },
            transform: {
                scaleX: 1,
                scaleY: 1,
                shearX: 0,
                shearY: 0,
                translateX: 0,
                translateY: e.pt,
                unit: 'EMU',
            },
            line: {
                lineProperties: {
                    lineFill: {
                        solidFill: {
                            color: color,
                            alpha: 1,
                        }
                    },
                    weight: {
                        magnitude: PT,
                        unit: 'EMU'
                    },
                    dashStyle: 'SOLID',
                },
                lineType: 'STRAIGHT_LINE',
                lineCategory: 'STRAIGHT'
            },
            additional: {
                originalType: 'line',
            }
        });
    }
    return lines;
}

class Templates {
    constructor(pageSize) {
        this.pageSize = consumeSize(pageSize);
        this.__templates = [];
        this.__layouts = [];
    }

    __getLayout(page) {
        // in EMU
        let layout = {
            pageSize: this.pageSize,
            pageElements: [],
        };
    
        if (!page.hasOwnProperty('pageElements')) {
            page.pageElements = [];
        }
    
        for (let pageElement of page.pageElements) {
            let size = undefined;
            if (pageElement.hasOwnProperty('size')) {
                size = JSON.parse(JSON.stringify(pageElement.size));
            }
            let transform = { ...pageElement.transform };
    
            if (pageElement.hasOwnProperty('elementGroup')) {
                let result = this.__getCoveringRectangle(pageElement.elementGroup.children);
                size = result.size;
                transform = multiplyTransforms(transform, result.transform);
            }
            
            size = consumeSize(size);
            transform = consumeTransform(transform);
    
            let startX = transform.translateX;
            let startY = transform.translateY;
    
            let finishX = size.width * transform.scaleX + size.height * transform.shearX + transform.translateX;
            let finishY = size.width * transform.shearY + size.height * transform.scaleY + transform.translateY;
    
            if (startX > finishX) {
                [startX, finishX] = [finishX, startX]; 
            }

            if (startY > finishY) {
                [startY, finishY] = [finishY, startY]; 
            }

            layout.pageElements.push({
                startX,
                startY,
                finishX,
                finishY,
                type: getPageElementType(pageElement),
            });
        }
        return layout;
    }

    __getCoveringRectangle(pageElements) {
        let layout = this.__getLayout({pageElements});

        // do transform
        
        let rectangle = {
            sx: Number.MAX_VALUE,
            sy: Number.MAX_VALUE,
            fx: -Number.MAX_VALUE,
            fy: -Number.MAX_VALUE,
        };
        for (let e of layout.pageElements) {
            rectangle.sx = Math.min(rectangle.sx, e.startX);
            rectangle.sy = Math.min(rectangle.sy, e.startY);
            rectangle.fx = Math.max(rectangle.fx, e.finishX);
            rectangle.fy = Math.max(rectangle.fy, e.finishY);
        }

        let transform = { ...DEFAULT_TRANSFORM };
        let size = JSON.parse(JSON.stringify(DEFAULT_SIZE));
        transform.translateX = rectangle.sx;
        transform.translateY = rectangle.sy;

        size.width.magnitude = rectangle.fx - rectangle.sx;
        size.height.magnitude = rectangle.fy - rectangle.sy;
        return {
            transform,
            size,
        };
    }

    __getComplexity(page) {
        return 0;
    }

    __add(layout, pageId, originalId, page, weight) {

        page = this.sanitizePage(page);

        page.pageElements = page.pageElements.concat(toLines(layout));

        this.__templates.push({
            pageId,
            page,
            weight,
            originalId,
        });
        this.__layouts.push({
            layout,
        });
    }

    addCustom(pageId, originalId, page) {
        if (this.__getComplexity(page) <= 0.5) {
            let layout = this.__getLayout(page);
            this.__add(layout, pageId, originalId, page, 2);
        }
    }

    addDefault(pageId, originalId, page) {
        let layout = this.__getLayout(page);
        this.__add(layout, pageId, originalId, page, 1);
    }

    getTemplates() {
        return this.__templates;
    }

    __transformElementGroups(pageElements) {
        let newPageElements = [];
        for (let pageElement of pageElements) {
            if (!pageElement.hasOwnProperty('elementGroup')) {
                newPageElements.push(pageElement);
                continue;
            }
            if (!pageElement.elementGroup.hasOwnProperty('children')) {
                continue;
            }
            let children = this.__transformElementGroups(pageElement.elementGroup.children);
            if (children.length === 0) {
                continue;
            }
            
            let result = this.__getCoveringRectangle(children);

            if (pageElement.hasOwnProperty('transform')) {
                result.transform = multiplyTransforms(pageElement.transform, result.transform);
            }

            if (result.size.height.magnitude === 0 || result.size.width.magnitude === 0) {
                continue;
            }
            if (result.size.height.magnitude < 0 || result.size.width.magnitude < 0) {
                console.log(result, pageElements, this.__getLayout({pageElements: children}));
            }


            let newPageElement = {
                additional: pageElement.additional,
                size: result.size,
                transform: result.transform,
                shape: {
                    shapeType: 'RECTANGLE',
                    shapeProperties: {
                        outline: {
                            outlineFill: {
                                solidFill: {
                                    color: {
                                        rgbColor: {
                                            red: 0,
                                            green: 1,
                                            blue: 0,
                                        },
                                    },
                                    alpha: 1,
                                }
                            },
                            weight: {
                                magnitude: PT,
                                unit: 'EMU',
                            },
                            dashStyle: 'DOT',
                        }
                    },
                    placeholder: {
                        type: 'OBJECT',
                    }
                }
            }
            
            newPageElements.push(newPageElement);
        }
        return newPageElements;
    }
    
    __mergeSmallElements(page) {
        return page;
    }
    
    __deleteSmallElements(page) {
        return page;
    }

    sanitizePage(page) {
        page.pageElements = this.__transformElementGroups(page.pageElements);
        page = this.__mergeSmallElements(page);
        page = this.__deleteSmallElements(page);
        return page;
    }
}

export default Templates;

/**
 * {
  "createShape": {
    "objectId": "9f1eae2a-4501-410a-aca9-c2cf69197c0e",
    "elementProperties": {
      "pageObjectId": "550a9847-26a3-46b1-ac3d-15c705b5af8f",
      "size": {
        "width": {
          "magnitude": 6845931.665,
          "unit": "EMU"
        },
        "height": {
          "magnitude": 6058938.7825,
          "unit": "EMU"
        }
      },
      "transform": {
        "scaleX": 0.9548,
        "scaleY": 0.9548,
        "translateX": 717473.419651,
        "translateY": 588354.976263,
        "unit": "EMU",
        "shearX": 0,
        "shearY": 0
      }
    },
    "shapeType": "RECTANGLE"
  }
}

{
  "createShape": {
    "objectId": "3c6654ed-2313-4b93-9067-369877f343c2",
    "elementProperties": {
      "pageObjectId": "550a9847-26a3-46b1-ac3d-15c705b5af8f",
      "size": {
        "width": {
          "magnitude": 6845931.665,
          "unit": "EMU"
        },
        "height": {
          "magnitude": 6058938.7825,
          "unit": "EMU"
        }
      },
      "transform": {
        "scaleX": 1,
        "scaleY": 1,
        "translateX": 5266783.6975,
        "translateY": 773321.9425,
        "unit": "EMU",
        "shearX": 0,
        "shearY": 0
      }
    },
    "shapeType": "RECTANGLE"
  }
}
 */

/*
{
  "createShape": {
    "objectId": "a1578be1-9b00-4c92-b897-d0dacf7a43a9",
    "elementProperties": {
      "pageObjectId": "2858f0d4-8547-4a80-b4ff-fcbe3791a480",
      "size": {
        "width": {
          "magnitude": 125332.80249999929,
          "unit": "EMU"
        },
        "height": {
          "magnitude": 1148318.4525000004,
          "unit": "EMU"
        }
      },
      "transform": {
        "scaleX": 1,
        "scaleY": 1,
        "translateX": 5266783.6975,
        "translateY": 773321.9425,
        "unit": "EMU",
        "shearX": 0,
        "shearY": 0
      }
    },
    "shapeType": "RECTANGLE"
  }
}
*/