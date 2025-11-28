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
      
      const attrs = mergeAttributes(HTMLAttributes, {
        class: display ? 'math-block' : 'math-inline',
        'data-formula': formula,
        'data-display': display ? '' : null,
      });
      
      // HTML 문자열을 직접 삽입하기 위해 dangerouslySetInnerHTML과 유사한 방식 사용
      return ['span', attrs, 0];
    } catch (error) {
      return [
        'span',
        mergeAttributes(HTMLAttributes, { class: 'math-error' }),
        `수식 오류: ${formula}`,
      ];
    }
  },

  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const { formula, display } = node.attrs;
      const dom = document.createElement('span');
      
      if (!formula) {
        dom.className = 'math-empty';
        dom.textContent = '수식';
        return { dom };
      }

      try {
        const html = katex.renderToString(formula, {
          throwOnError: false,
          displayMode: display,
        });
        
        dom.className = display ? 'math-block' : 'math-inline';
        dom.setAttribute('data-formula', formula);
        if (display) {
          dom.setAttribute('data-display', '');
        }
        dom.innerHTML = html;
        
        return { dom };
      } catch (error) {
        dom.className = 'math-error';
        dom.textContent = `수식 오류: ${formula}`;
        return { dom };
      }
    };
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

