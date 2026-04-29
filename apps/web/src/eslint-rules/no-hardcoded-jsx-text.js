const ALLOWED_TEXT = new Set(['.', ',', ':', ';', '/', '|', '-', '(', ')']);

function isMeaningfulText(value) {
  const text = value.replace(/\s+/g, ' ').trim();
  if (!text) return false;
  if (ALLOWED_TEXT.has(text)) return false;
  return /[\p{L}\p{N}]/u.test(text);
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require user-facing JSX strings to come from next-intl translations.'
    },
    messages: {
      text: 'Move user-facing JSX text into messages/*.json and render it through t().',
      attr: 'Move user-facing attribute text into messages/*.json and render it through t().'
    },
    schema: []
  },
  create(context) {
    return {
      JSXText(node) {
        if (isMeaningfulText(node.value)) {
          context.report({node, messageId: 'text'});
        }
      },
      JSXExpressionContainer(node) {
        if (node.expression.type === 'Literal' && typeof node.expression.value === 'string') {
          if (isMeaningfulText(node.expression.value)) {
            context.report({node, messageId: 'text'});
          }
        }
      },
      JSXAttribute(node) {
        if (!node.value || node.value.type !== 'Literal' || typeof node.value.value !== 'string') {
          return;
        }

        const attrName = node.name.type === 'JSXIdentifier' ? node.name.name : '';
        const checkedAttrs = new Set(['aria-label', 'title', 'placeholder', 'alt']);
        if (checkedAttrs.has(attrName) && isMeaningfulText(node.value.value)) {
          context.report({node, messageId: 'attr'});
        }
      }
    };
  }
};
