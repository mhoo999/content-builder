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
    
    const attrs = mergeAttributes(HTMLAttributes, {
      class: display ? 'math-block' : 'math-inline',
      'data-formula': formula || '',
      'data-display': display ? '' : null,
    });
    
    // atom 노드는 자식이 없어야 하므로 빈 배열 반환
    // 실제 렌더링은 addNodeView에서 처리
    return ['span', attrs];
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

