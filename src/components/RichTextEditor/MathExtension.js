import { Node, mergeAttributes } from '@tiptap/core';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export const Math = Node.create({
  name: 'math',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      formula: {
        default: '',
        parseHTML: element => element.getAttribute('data-formula'),
        renderHTML: attributes => ({
          'data-formula': attributes.formula,
        }),
      },
      display: {
        default: false,
        parseHTML: element => element.hasAttribute('data-display'),
        renderHTML: attributes => ({
          'data-display': attributes.display ? '' : null,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-formula]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { formula, display } = node.attrs;
    
    if (!formula) {
      return ['span', mergeAttributes(HTMLAttributes, { class: 'math-empty' }), '수식'];
    }

    try {
      const html = katex.renderToString(formula, {
        throwOnError: false,
        displayMode: display,
      });
      
      return [
        'span',
        mergeAttributes(HTMLAttributes, {
          class: display ? 'math-block' : 'math-inline',
          'data-formula': formula,
          'data-display': display ? '' : null,
        }),
        ['span', { innerHTML: html }],
      ];
    } catch (error) {
      return [
        'span',
        mergeAttributes(HTMLAttributes, { class: 'math-error' }),
        `수식 오류: ${formula}`,
      ];
    }
  },

  addCommands() {
    return {
      setMath: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});

