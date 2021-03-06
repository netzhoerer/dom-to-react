import React from 'react';
import noTextChildNodes from './noTextChildNodes';
import possibleStandardNames from './possibleStandardNames';

class Dom2React {

  constructor(tests) {
    this.tests = tests || [];
  }

  prepareChildren(childNodeList, level) {
    const children = Array.prototype.slice.call(childNodeList).map((node, index) =>
      this.prepareNode(node, level + 1, index)
    ).filter(Boolean);
    if (!children.length) return null;
    return children;
  }


  prepareAttributes(node, reactKey) {
    const attributes = {
      key: reactKey,
    };

    const nodeClassNames = node.getAttribute('class');
    if (nodeClassNames) {
      attributes.className = nodeClassNames;
    }

    Array.prototype.slice.call(node.attributes).map((att) => {
      switch (att.name) {
        //these are manually handled above, so break;
        case 'class':
        case 'style':
          break;
        case 'checked':
        case 'selected':
        case 'disabled':
        case 'autoplay':
        case 'controls':
          attributes[att.name] = att.name;
          break;
        default:
          if (possibleStandardNames[att.name]) {
            attributes[possibleStandardNames[att.name]] = att.value;
          } else {
            attributes[att.name] = att.value;
          }
      }
      return null;
    });
    return attributes;
  }

  prepareNode(_node, level = 0, index = 0) {
    if (!_node) return null;
    let node = _node;
    const key = `${level}-${index}`;
    const result = [];

    this.tests.forEach((test) => {
      if (test.condition(node, key, level, this)) {
        if (typeof test.modify === 'function') {
          node = test.modify(node, key, level, this);
          if (!(node instanceof Node)) {
            node = _node;
            console.warn('The `modify`-method always must return a valid DomNode (instanceof Node) - your modification will be ignored (Hint: if you want to render a React-component, use the `action`-method instead)');
          }
        }
        if (typeof test.action === 'function') {
          result.push(test.action(node, key, level, this));
        }
      }
    });

    if (result.length) return result;

    switch (node.nodeType) {
      case 1: // regular dom-node
        return React.createElement(
          node.nodeName.toLowerCase(),
          this.prepareAttributes(node, key),
          this.prepareChildren(node.childNodes, level)
        );

      case 3: // textnode
        const nodeText = node.nodeValue.toString();

        if (!node.parentNode) {
          return nodeText;
        }

        const parentNodeName = node.parentNode.nodeName.toLowerCase();

        if (noTextChildNodes.indexOf(parentNodeName) !== -1) {
          if (/\S/.test(nodeText)) {
            console.warn(`a textnode is not allowed inside '${parentNodeName}'. your text "${nodeText}" will be ignored`);
          }
          return null;
        }

        return nodeText;

      case 8: // html-comment
        // console.info(node.nodeValue.toString());
        return null;

      default:
        // console.warn(`unhandled nodetype ${node.nodeType}`);
        return null;
    }
  }

}

export default Dom2React;
