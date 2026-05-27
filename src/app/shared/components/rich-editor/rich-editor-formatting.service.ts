import { Injectable } from '@angular/core';

export type InlineFormat = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code';
export type BlockFormat = 'ul' | 'ol' | 'blockquote' | 'pre';

@Injectable()
export class RichEditorFormattingService {
  /**
   * Apply inline formatting to current selection using modern Range API
   */
  applyInlineFormat(format: InlineFormat): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return; // No selection

    const tagMap: Record<InlineFormat, string> = {
      bold: 'strong',
      italic: 'em',
      underline: 'u',
      strikethrough: 's',
      code: 'code'
    };

    const tagName = tagMap[format];
    const isActive = this.isFormatActive(format);

    if (isActive) {
      this.removeFormat(range, tagName);
    } else {
      this.addFormat(range, tagName);
    }

    // Restore selection
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Apply block formatting to current selection
   */
  applyBlockFormat(format: BlockFormat): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const blockElement = this.getBlockParent(range.commonAncestorContainer);

    if (!blockElement) return;

    if (format === 'ul' || format === 'ol') {
      this.toggleList(blockElement, format);
    } else if (format === 'blockquote') {
      this.toggleBlockquote(blockElement);
    } else if (format === 'pre') {
      this.toggleCodeBlock(blockElement);
    }
  }

  /**
   * Check if a format is currently active at cursor position
   */
  isFormatActive(format: InlineFormat): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    const tagMap: Record<InlineFormat, string> = {
      bold: 'STRONG',
      italic: 'EM',
      underline: 'U',
      strikethrough: 'S',
      code: 'CODE'
    };

    const targetTag = tagMap[format];
    let node: Node | null = selection.anchorNode;

    while (node && node.nodeType !== Node.DOCUMENT_NODE) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        if (element.tagName === targetTag) {
          return true;
        }
        // Check for contenteditable boundary
        if (element.hasAttribute('contenteditable')) {
          break;
        }
      }
      node = node.parentNode;
    }

    return false;
  }

  /**
   * Check if a block format is currently active
   */
  isBlockFormatActive(format: BlockFormat): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    const range = selection.getRangeAt(0);
    const blockElement = this.getBlockParent(range.commonAncestorContainer);

    if (!blockElement) return false;

    if (format === 'ul') {
      return this.isInsideList(blockElement, 'UL');
    } else if (format === 'ol') {
      return this.isInsideList(blockElement, 'OL');
    } else if (format === 'blockquote') {
      return this.isInsideBlockquote(blockElement);
    } else if (format === 'pre') {
      return this.isInsideCodeBlock(blockElement);
    }

    return false;
  }

  /**
   * Add format wrapper to range
   */
  private addFormat(range: Range, tagName: string): void {
    const wrapper = document.createElement(tagName);
    
    try {
      range.surroundContents(wrapper);
    } catch (e) {
      // If surroundContents fails (e.g., partial element selection),
      // extract contents and wrap them
      const fragment = range.extractContents();
      wrapper.appendChild(fragment);
      range.insertNode(wrapper);
    }
  }

  /**
   * Remove format wrapper from range
   */
  private removeFormat(range: Range, tagName: string): void {
    const upperTagName = tagName.toUpperCase();
    const container = range.commonAncestorContainer;
    
    // Find the formatting element
    let formatElement: HTMLElement | null = null;
    let node: Node | null = container;
    
    while (node && node.nodeType !== Node.DOCUMENT_NODE) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.tagName === upperTagName) {
          formatElement = element;
          break;
        }
        if (element.hasAttribute('contenteditable')) {
          break;
        }
      }
      node = node.parentNode;
    }

    if (formatElement && formatElement.parentNode) {
      // Replace format element with its contents
      while (formatElement.firstChild) {
        formatElement.parentNode.insertBefore(formatElement.firstChild, formatElement);
      }
      formatElement.parentNode.removeChild(formatElement);
    }
  }

  /**
   * Get block-level parent element
   */
  private getBlockParent(node: Node): HTMLElement | null {
    let current: Node | null = node;
    
    while (current && current.nodeType !== Node.DOCUMENT_NODE) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const element = current as HTMLElement;
        const display = window.getComputedStyle(element).display;
        
        if (display === 'block' || element.tagName === 'DIV' || element.tagName === 'P') {
          return element;
        }
        
        if (element.hasAttribute('contenteditable')) {
          return element;
        }
      }
      current = current.parentNode;
    }
    
    return null;
  }

  /**
   * Toggle list format
   */
  private toggleList(blockElement: HTMLElement, listType: 'ul' | 'ol'): void {
    const listTag = listType.toUpperCase();
    
    if (this.isInsideList(blockElement, listTag)) {
      // Remove list formatting
      const listElement = this.findParentByTag(blockElement, listTag);
      if (listElement && listElement.parentNode) {
        const p = document.createElement('p');
        // Transfer children instead of innerHTML to preserve DOM structure
        while (blockElement.firstChild) {
          p.appendChild(blockElement.firstChild);
        }
        listElement.parentNode.replaceChild(p, listElement);
      }
    } else {
      // Add list formatting
      const list = document.createElement(listType);
      const li = document.createElement('li');
      // Transfer children instead of innerHTML to preserve DOM structure
      while (blockElement.firstChild) {
        li.appendChild(blockElement.firstChild);
      }
      if (li.childNodes.length === 0) {
        li.appendChild(document.createElement('br'));
      }
      list.appendChild(li);
      
      if (blockElement.parentNode) {
        blockElement.parentNode.replaceChild(list, blockElement);
      }
    }
  }

  /**
   * Toggle blockquote format
   */
  private toggleBlockquote(blockElement: HTMLElement): void {
    if (this.isInsideBlockquote(blockElement)) {
      // Remove blockquote
      const blockquote = this.findParentByTag(blockElement, 'BLOCKQUOTE');
      if (blockquote && blockquote.parentNode) {
        const p = document.createElement('p');
        // Transfer children instead of innerHTML to preserve DOM structure
        while (blockElement.firstChild) {
          p.appendChild(blockElement.firstChild);
        }
        blockquote.parentNode.replaceChild(p, blockquote);
      }
    } else {
      // Add blockquote
      const blockquote = document.createElement('blockquote');
      const p = document.createElement('p');
      // Transfer children instead of innerHTML to preserve DOM structure
      while (blockElement.firstChild) {
        p.appendChild(blockElement.firstChild);
      }
      if (p.childNodes.length === 0) {
        p.appendChild(document.createElement('br'));
      }
      blockquote.appendChild(p);
      
      if (blockElement.parentNode) {
        blockElement.parentNode.replaceChild(blockquote, blockElement);
      }
    }
  }

  /**
   * Toggle code block format
   */
  private toggleCodeBlock(blockElement: HTMLElement): void {
    if (this.isInsideCodeBlock(blockElement)) {
      // Remove code block
      const pre = this.findParentByTag(blockElement, 'PRE');
      if (pre && pre.parentNode) {
        const p = document.createElement('p');
        const code = pre.querySelector('code');
        const sourceElement = code || pre;
        // Transfer children instead of innerHTML to preserve DOM structure
        while (sourceElement.firstChild) {
          p.appendChild(sourceElement.firstChild);
        }
        pre.parentNode.replaceChild(p, pre);
      }
    } else {
      // Add code block
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      // Transfer children instead of innerHTML to preserve DOM structure
      while (blockElement.firstChild) {
        code.appendChild(blockElement.firstChild);
      }
      if (code.childNodes.length === 0) {
        code.appendChild(document.createElement('br'));
      }
      pre.appendChild(code);
      
      if (blockElement.parentNode) {
        blockElement.parentNode.replaceChild(pre, blockElement);
      }
    }
  }

  /**
   * Check if element is inside a list
   */
  private isInsideList(element: HTMLElement, listTag: string): boolean {
    return !!this.findParentByTag(element, listTag);
  }

  /**
   * Check if element is inside a blockquote
   */
  private isInsideBlockquote(element: HTMLElement): boolean {
    return !!this.findParentByTag(element, 'BLOCKQUOTE');
  }

  /**
   * Check if element is inside a code block
   */
  private isInsideCodeBlock(element: HTMLElement): boolean {
    return !!this.findParentByTag(element, 'PRE');
  }

  /**
   * Find parent element by tag name
   */
  private findParentByTag(element: HTMLElement, tagName: string): HTMLElement | null {
    let current: Node | null = element;
    
    while (current && current.nodeType !== Node.DOCUMENT_NODE) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const el = current as HTMLElement;
        if (el.tagName === tagName) {
          return el;
        }
        if (el.hasAttribute('contenteditable')) {
          return null;
        }
      }
      current = current.parentNode;
    }
    
    return null;
  }

  /**
   * Sanitize and normalize HTML output
   */
  sanitizeHTML(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;

    // Remove empty tags
    this.removeEmptyTags(div);

    // Remove redundant spans and inline styles
    this.cleanSpans(div);

    // Normalize whitespace
    this.normalizeWhitespace(div);

    return div.innerHTML;
  }

  /**
   * Remove empty tags from element tree
   */
  private removeEmptyTags(element: HTMLElement): void {
    const emptyTags = element.querySelectorAll('*');
    
    emptyTags.forEach(tag => {
      if (tag.tagName !== 'BR' && 
          !tag.textContent?.trim() && 
          tag.children.length === 0) {
        tag.remove();
      }
    });
  }

  /**
   * Clean unnecessary spans and inline styles
   */
  private cleanSpans(element: HTMLElement): void {
    const spans = element.querySelectorAll('span');
    
    spans.forEach(span => {
      // Remove style attribute
      span.removeAttribute('style');
      
      // If span has no attributes, unwrap it
      if (!span.attributes.length) {
        while (span.firstChild) {
          span.parentNode?.insertBefore(span.firstChild, span);
        }
        span.remove();
      }
    });

    // Remove style attributes from all elements
    const allElements = element.querySelectorAll('*');
    allElements.forEach(el => {
      el.removeAttribute('style');
    });
  }

  /**
   * Normalize whitespace in element tree
   */
  private normalizeWhitespace(element: HTMLElement): void {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT
    );

    const textNodes: Text[] = [];
    let node: Node | null;
    
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }

    textNodes.forEach(textNode => {
      if (textNode.parentElement?.tagName !== 'PRE' && 
          textNode.parentElement?.tagName !== 'CODE') {
        // Normalize multiple spaces to single space
        textNode.textContent = textNode.textContent?.replace(/\s+/g, ' ') || '';
      }
    });
  }

  /**
   * Convert HTML to plain text for paste operations
   */
  htmlToPlainText(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || '';
  }
}
