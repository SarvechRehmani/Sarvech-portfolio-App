import DOMPurify from 'dompurify';

/** Keep the relational array contract while presenting existing HTML as editable prose. */
export function featuresToHtml(items: string[] = []): string {
  const list = document.createElement('ul');
  for (const item of items || []) {
    const parsed = new DOMParser().parseFromString(DOMPurify.sanitize(item), 'text/html');
    const onlyList = parsed.body.children.length === 1 && /^(UL|OL)$/.test(parsed.body.firstElementChild!.tagName);
    if (onlyList && list.lastElementChild) list.lastElementChild.append(parsed.body.firstElementChild!);
    else {
      const li = document.createElement('li');
      li.innerHTML = DOMPurify.sanitize(item);
      list.append(li);
    }
  }
  return list.children.length ? list.outerHTML : '';
}

export function htmlToFeatures(html: string): string[] {
  const body = new DOMParser().parseFromString(DOMPurify.sanitize(html), 'text/html').body;
  const result: string[] = [];
  for (const node of Array.from(body.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE && /^(UL|OL)$/.test((node as Element).tagName)) {
      for (const item of Array.from((node as Element).children)) {
        if (item.textContent?.trim() || item.querySelector('img,hr')) result.push(item.innerHTML);
      }
    } else if (node.textContent?.trim() || node.nodeType === Node.ELEMENT_NODE && (/^(IMG|HR)$/.test((node as Element).tagName) || (node as Element).querySelector('img,hr'))) {
      result.push(node.nodeType === Node.ELEMENT_NODE ? (node as Element).outerHTML : DOMPurify.sanitize(node.textContent || ''));
    }
  }
  return result;
}
